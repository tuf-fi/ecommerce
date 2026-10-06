import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { record, staffActor } from "../services/audit.service";
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
