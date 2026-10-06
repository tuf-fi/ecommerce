import { notifyOrderStatus,notifyPaymentRejected } from "../services/customerNotifications.service";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { sniffImage } from "../lib/imageSniff";
import { recordOrderStatus, record, staffActor } from "../services/audit.service";
import { sendMail } from "../services/email.service";
import { canAccess } from "../lib/sections";

export const METHODS = ["gcash", "maya", "bank"] as const;
const METHOD_LABEL: Record<(typeof METHODS)[number], string> = { gcash: "GCash", maya: "Maya", bank: "Bank transfer" };
const MAX_PROOFS_PER_ORDER = 5;

export const submitProofSchema = z.object({
  method: z.enum(METHODS),
  reference: z.string().trim().max(60).optional(),
  note: z.string().trim().max(300).optional(),
});

export const reviewProofSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("approve") }),
  z.object({ decision: z.literal("reject"), reason: z.string({ error: "Say why, so the customer knows what to fix" }).trim().min(3, "Say why, so the customer knows what to fix").max(300) }),
]);

// The customer sends a screenshot of their transfer for an unpaid order. It waits (status PENDING) for staff to check it.
export async function submitProof(req: Request, res: Response) {
  const number = String(req.params.no);
  const fields = submitProofSchema.safeParse(req.body);
  if (!fields.success) throw new HttpError(400, fields.error.issues[0]?.message ?? "Invalid request");
  if (!req.file) throw new HttpError(400, 'Attach a screenshot in the "file" field');

  // Trust the bytes, not the filename or the declared type.
  const mimeType = sniffImage(req.file.buffer);
  if (!mimeType) throw new HttpError(400, "That file isn't a JPG, PNG or WEBP image");

  const order = await prisma.order.findFirst({
    where: { number, customerId: req.customerId },
    select: { id: true, status: true, total: true, paymentProofs: { select: { status: true } } },
  });
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status !== "PENDING") throw new HttpError(409, "This order isn't waiting for payment");
  if (order.paymentProofs.some((p) => p.status === "PENDING")) throw new HttpError(409, "Your last screenshot is still being checked");
  if (order.paymentProofs.length >= MAX_PROOFS_PER_ORDER) throw new HttpError(409, "Too many attempts for this order — please contact us");

  const proof = await prisma.paymentProof.create({
    data: {
      orderId: order.id,
      method: fields.data.method,
      reference: fields.data.reference || null,
      note: fields.data.note || null,
      mimeType,
      sizeBytes: req.file.size,
      file: { create: { data: new Uint8Array(req.file.buffer) } },
    },
    select: { id: true, status: true, method: true, createdAt: true },
  });

  if (process.env.CONTACT_INBOX) {
    void sendMail({
      to: process.env.CONTACT_INBOX,
      subject: `Payment proof to review — ${number}`,
      text: `A customer uploaded proof of payment for order ${number} (₱${order.total.toLocaleString()}, ${METHOD_LABEL[fields.data.method]}).\nReview it in the admin panel: Orders → ${number}.`,
    });
  }
  res.status(201).json({ proof: { id: proof.id, status: proof.status, method: proof.method, createdAt: proof.createdAt.toISOString() } });
}

// The screenshot itself. Only the customer who owns the order, or signed-in staff, can fetch it.
export async function getProofImage(req: Request, res: Response) {
  const proofId = Number(req.params.id);
  if (req.staff && !canAccess(req.staff, "orders")) throw new HttpError(403, "Your account doesn't have access to this area");
  const proof = await prisma.paymentProof.findFirst({
    where: { id: proofId, order: { number: String(req.params.no), ...(req.staff ? {} : { customerId: req.customerId }) } },
    select: { mimeType: true, file: { select: { data: true } } },
  });
  if (!proof?.file) throw new HttpError(404, "Not found");

  res.setHeader("Content-Type", proof.mimeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Disposition", "inline");
  res.send(Buffer.from(proof.file.data));
}

// Staff verdict on a screenshot. Approving marks the order paid; rejecting leaves it unpaid so the customer can try again.
export async function reviewProof(req: Request, res: Response) {
  const number = String(req.params.no);
  const proofId = Number(req.params.id);
  const body = req.body as z.infer<typeof reviewProofSchema>;
  const staff = req.staff!;

  const result = await prisma.$transaction(async (tx) => {
    const proof = await tx.paymentProof.findFirst({ where: { id: proofId, order: { number } }, include: { order: true } });
    if (!proof) throw new HttpError(404, "Not found");

    // Claiming the proof first (only while still PENDING) means two staff acting at once can't both decide.
    const claimed = await tx.paymentProof.updateMany({
      where: { id: proof.id, status: "PENDING" },
      data:
        body.decision === "approve"
          ? { status: "APPROVED", reviewedAt: new Date(), reviewedById: staff.id, reviewedBy: staff.name }
          : { status: "REJECTED", rejectReason: body.reason, reviewedAt: new Date(), reviewedById: staff.id, reviewedBy: staff.name },
    });
    if (claimed.count === 0) throw new HttpError(409, "Someone has already reviewed this screenshot");

    if (body.decision === "approve") {
      const moved = await tx.order.updateMany({
        where: { id: proof.orderId, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date(), paymentMethod: proof.method },
      });
      // e.g. the order was cancelled while the screenshot waited; throwing undoes the claim above.
      if (moved.count === 0) throw new HttpError(409, "This order is no longer waiting for payment");
      await recordOrderStatus(tx, {
        orderId: proof.orderId,
        from: "PENDING",
        to: "PAID",
        actor: staffActor(staff),
        note: `Payment verified (${METHOD_LABEL[proof.method as (typeof METHODS)[number]] ?? proof.method}${proof.reference ? `, ref ${proof.reference}` : ""})`,
      });
    } else {
      await record(tx, {
        entityType: "order",
        entityId: number,
        action: "payment-proof-rejected",
        actor: staffActor(staff),
        details: { proofId: proof.id, reason: body.reason },
      });
    }
    return { email: proof.order.shipEmail, total: proof.order.total, customerId: proof.order.customerId };
  });

  const ref = { customerId: result.customerId, number, total: result.total };
  void (body.decision === "approve" ? notifyOrderStatus(ref, "PAID", false, true) : notifyPaymentRejected(ref, body.reason));

  void sendMail(
    body.decision === "approve"
      ? { to: result.email, subject: `Payment received — order ${number}`, text: `We've verified your payment of ₱${result.total.toLocaleString()} for order ${number}. We'll prepare it for shipping.` }
      : { to: result.email, subject: `We couldn't verify your payment — order ${number}`, text: `We couldn't verify the screenshot you sent for order ${number}.\nReason: ${body.reason}\nPlease upload a new screenshot from My Purchase.` },
  );
  res.json({ ok: true });
}
