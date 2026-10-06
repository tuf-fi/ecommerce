import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { record, recordOrderStatus, staffActor } from "../services/audit.service";
import { adjustStockTx } from "../services/stock.service";
import { redeemVoucher } from "../services/voucher.service";
import { emailRefund } from "../services/orderEmails.service";
import { notifyRefund } from "../services/customerNotifications.service";

export const refundSchema = z.object({
  amount: z.number().int().min(1, "Enter the amount you sent back"),
  note: z.string().trim().max(300).optional(),
});

// Money is returned by hand (GCash / bank transfer). This records that it was done, how much, and by whom, so a paid order
// that was cancelled or returned never gets forgotten, and the customer is told. Administrators only.
export async function recordRefund(req: Request, res: Response) {
  const number = String(req.params.no);
  const { amount, note } = req.body as z.infer<typeof refundSchema>;

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { number } });
    if (!existing) throw new HttpError(404, "Order not found");
    if (!existing.paidAt) throw new HttpError(409, "This order was never paid, so there is nothing to refund");
    if (amount > existing.total) throw new HttpError(400, `The refund can't be more than the order total (₱${existing.total.toLocaleString()})`);

    // One refund per order; the condition makes a double click harmless.
    const claimed = await tx.order.updateMany({ where: { id: existing.id, refundedAt: null }, data: { refundedAt: new Date(), refundAmount: amount, refundNote: note || null } });
    if (claimed.count === 0) throw new HttpError(409, "A refund has already been recorded for this order");
    await record(tx, { entityType: "order", entityId: number, action: "refund", actor: staffActor(req.staff!), details: { amount, note: note || null } });
    return tx.order.findUniqueOrThrow({ where: { id: existing.id } });
  });
  void emailRefund({ number: order.number, shipEmail: order.shipEmail, shipName: order.shipName, total: order.total }, amount);
  void notifyRefund(order, amount);
  res.json({ ok: true, refund: { at: order.refundedAt!.toISOString(), amount, note: order.refundNote } });
}

// Puts an order back to Pending after the system cancelled it (unpaid past the hold window) while the customer was still
// paying. The stock is taken again, so it fails with "out of stock" if the items sold meanwhile. Orders that were paid or
// refunded can't be reopened: those are handled with the refund record instead. Administrators only.
export async function reopenOrder(req: Request, res: Response) {
  const number = String(req.params.no);
  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { number }, include: { items: true, customer: true } });
    if (!existing) throw new HttpError(404, "Order not found");
    if (existing.status !== "CANCELLED") throw new HttpError(409, "Only a cancelled order can be reopened");
    if (existing.paidAt || existing.refundedAt) throw new HttpError(409, "This order was paid, so it can't be reopened");

    const moved = await tx.order.updateMany({ where: { id: existing.id, status: "CANCELLED" }, data: { status: "PENDING" } });
    if (moved.count === 0) throw new HttpError(409, "This order was just updated — refresh and try again");
    const actor = staffActor(req.staff!);
    await recordOrderStatus(tx, { orderId: existing.id, from: "CANCELLED", to: "PENDING", actor, note: "Reopened" });

    // Spent again, as when the order was first placed; refused if the code has expired or been used up since.
    if (existing.voucherCode) {
      try {
        await redeemVoucher(tx, existing.voucherCode, existing.customer, existing.id);
      } catch {
        throw new HttpError(409, `The discount code ${existing.voucherCode} is no longer valid, so this order can't be reopened at its old price`);
      }
    }
    for (const item of existing.items) {
      await adjustStockTx(tx, { productId: item.productId, sizeId: item.sizeId, delta: -item.quantity, reason: "SALE", orderId: existing.id, staffId: actor.id ?? null, note: `Order ${number} reopened` });
    }
    await record(tx, { entityType: "order", entityId: number, action: "reopen", actor });
    return tx.order.findUniqueOrThrow({ where: { id: existing.id } });
  });
  res.json({ ok: true, status: order.status });
}
