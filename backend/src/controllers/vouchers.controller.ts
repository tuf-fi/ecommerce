import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { record, staffActor } from "../services/audit.service";
import { notifyVoucher } from "../services/customerNotifications.service";

export const createVoucherSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-]{2,29}$/, "Use 3–30 letters, numbers or dashes"),
  description: z.string().trim().min(1).max(120),
  percentOff: z.number().int().min(1).max(100),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  // null/omitted = anyone may use it any number of times in total; each customer still only once.
  maxUses: z.number().int().min(1).nullable().optional(),
  // Set to tie the code to one customer's email; blank = anyone.
  forEmail: z.string().trim().toLowerCase().email().nullable().optional(),
});

export const updateVoucherSchema = z
  .object({
    active: z.boolean(),
    description: z.string().trim().min(1).max(120),
    expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    maxUses: z.number().int().min(1).nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

const serialize = (v: { id: number; code: string; description: string; percentOff: number | null; expiresAt: Date | null; active: boolean; forEmail: string | null; maxUses: number | null; uses: number }) => ({
  id: v.id,
  code: v.code,
  description: v.description,
  percentOff: v.percentOff,
  expiresAt: v.expiresAt ? v.expiresAt.toISOString().slice(0, 10) : null,
  active: v.active,
  personalFor: v.forEmail,
  maxUses: v.maxUses,
  uses: v.uses,
});

// Everything, newest first; welcome codes (tied to one email) are listed too, marked by `personalFor`.
export async function listVouchers(_req: Request, res: Response) {
  const rows = await prisma.voucher.findMany({ orderBy: { id: "desc" }, take: 500 });
  res.json({ vouchers: rows.map(serialize) });
}

export async function createVoucher(req: Request, res: Response) {
  const d = req.body as z.infer<typeof createVoucherSchema>;
  const created = await prisma.$transaction(async (tx) => {
    if (await tx.voucher.findUnique({ where: { code: d.code } })) throw new HttpError(409, "That code already exists");
    const v = await tx.voucher.create({
      data: { code: d.code, description: d.description, percentOff: d.percentOff, expiresAt: d.expiresAt ? new Date(`${d.expiresAt}T23:59:59`) : null, maxUses: d.maxUses ?? null, forEmail: d.forEmail ?? null },
    });
    await record(tx, { entityType: "voucher", entityId: v.id, action: "create", actor: staffActor(req.staff!), details: { code: v.code, percentOff: v.percentOff, maxUses: v.maxUses, expiresAt: d.expiresAt ?? null, forEmail: v.forEmail } });
    return v;
  });
  if (created.forEmail) void notifyVoucher(created.forEmail, created.code, created.description, created.expiresAt);
  res.status(201).json({ voucher: serialize(created) });
}

export async function updateVoucher(req: Request, res: Response) {
  const id = Number(req.params.id);
  const d = req.body as z.infer<typeof updateVoucherSchema>;
  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.voucher.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Code not found");
    const v = await tx.voucher.update({
      where: { id },
      data: {
        ...(d.active !== undefined ? { active: d.active } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.expiresAt !== undefined ? { expiresAt: d.expiresAt ? new Date(`${d.expiresAt}T23:59:59`) : null } : {}),
        ...(d.maxUses !== undefined ? { maxUses: d.maxUses } : {}),
      },
    });
    await record(tx, { entityType: "voucher", entityId: id, action: "update", actor: staffActor(req.staff!), details: { code: v.code, changed: Object.keys(d) } });
    return v;
  });
  res.json({ voucher: serialize(updated) });
}

// Orders keep the code text they were placed with, so history survives; the per-customer use records go with the code.
export async function deleteVoucher(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.$transaction(async (tx) => {
    const existing = await tx.voucher.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Code not found");
    await tx.voucher.delete({ where: { id } });
    await record(tx, { entityType: "voucher", entityId: id, action: "delete", actor: staffActor(req.staff!), details: { code: existing.code, percentOff: existing.percentOff, uses: existing.uses } });
  });
  res.json({ ok: true });
}
