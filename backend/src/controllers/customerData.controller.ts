import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";

const MAX_ADDRESSES = 10;
const MAX_WISHLIST = 200;

// ---- delivery addresses -----------------------------------------------------------------------------------------------------

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Give the address a short name").max(40),
  text: z.string().trim().min(5, "Enter the full address").max(300),
  makeDefault: z.boolean().optional(),
});
export const addressPatchSchema = addressSchema.partial().extend({ isDefault: z.literal(true).optional() });

const pick = { id: true, label: true, text: true, isDefault: true } as const;

export async function listAddresses(req: Request, res: Response) {
  const rows = await prisma.address.findMany({ where: { customerId: req.customerId }, select: pick, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
  res.json({ addresses: rows });
}

export async function createAddress(req: Request, res: Response) {
  const d = req.body as z.infer<typeof addressSchema>;
  const customerId = req.customerId!;
  const created = await prisma.$transaction(async (tx) => {
    const existing = await tx.address.count({ where: { customerId } });
    if (existing >= MAX_ADDRESSES) throw new HttpError(409, `You can save up to ${MAX_ADDRESSES} addresses`);
    // The first address is the default automatically.
    const isDefault = existing === 0 || d.makeDefault === true;
    if (isDefault) await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
    return tx.address.create({ data: { customerId, label: d.label, text: d.text, isDefault }, select: pick });
  });
  res.status(201).json({ address: created });
}

export async function updateAddress(req: Request, res: Response) {
  const id = Number(req.params.id);
  const d = req.body as z.infer<typeof addressPatchSchema>;
  const customerId = req.customerId!;
  const updated = await prisma.$transaction(async (tx) => {
    // Scoped to the caller, so another customer's address id is simply "not found".
    const mine = await tx.address.findFirst({ where: { id, customerId }, select: { id: true } });
    if (!mine) throw new HttpError(404, "Address not found");
    if (d.isDefault) await tx.address.updateMany({ where: { customerId }, data: { isDefault: false } });
    return tx.address.update({
      where: { id },
      data: { ...(d.label !== undefined ? { label: d.label } : {}), ...(d.text !== undefined ? { text: d.text } : {}), ...(d.isDefault ? { isDefault: true } : {}) },
      select: pick,
    });
  });
  res.json({ address: updated });
}

export async function deleteAddress(req: Request, res: Response) {
  const id = Number(req.params.id);
  const customerId = req.customerId!;
  await prisma.$transaction(async (tx) => {
    const mine = await tx.address.findFirst({ where: { id, customerId } });
    if (!mine) throw new HttpError(404, "Address not found");
    await tx.address.delete({ where: { id } });
    // Removing the default promotes the most recently added one, so checkout always has a default while any address exists.
    if (mine.isDefault) {
      const next = await tx.address.findFirst({ where: { customerId }, orderBy: { id: "desc" }, select: { id: true } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  res.json({ ok: true });
}

// ---- wishlist -----------------------------------------------------------------------------------------------------------------

export const mergeWishlistSchema = z.object({ productIds: z.array(z.number().int().positive()).max(MAX_WISHLIST) });

export async function getWishlist(req: Request, res: Response) {
  const rows = await prisma.wishlistItem.findMany({ where: { customerId: req.customerId }, select: { productId: true }, orderBy: { createdAt: "asc" } });
  res.json({ productIds: rows.map((r) => r.productId) });
}

export async function addToWishlist(req: Request, res: Response) {
  const productId = Number(req.params.productId);
  const customerId = req.customerId!;
  if (!(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) throw new HttpError(404, "Product not found");
  if ((await prisma.wishlistItem.count({ where: { customerId } })) >= MAX_WISHLIST) throw new HttpError(409, "Your wishlist is full");
  await prisma.wishlistItem.upsert({ where: { customerId_productId: { customerId, productId } }, create: { customerId, productId }, update: {} });
  res.json({ ok: true });
}

export async function removeFromWishlist(req: Request, res: Response) {
  await prisma.wishlistItem.deleteMany({ where: { customerId: req.customerId, productId: Number(req.params.productId) } });
  res.json({ ok: true });
}

// Right after sign-in the browser sends what it had saved before, so nothing a shopper saved as a visitor is lost.
export async function mergeWishlist(req: Request, res: Response) {
  const { productIds } = req.body as z.infer<typeof mergeWishlistSchema>;
  const customerId = req.customerId!;
  const existing = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
  await prisma.wishlistItem.createMany({ data: existing.map((p) => ({ customerId, productId: p.id })), skipDuplicates: true });
  const rows = await prisma.wishlistItem.findMany({ where: { customerId }, select: { productId: true }, orderBy: { createdAt: "asc" } });
  res.json({ productIds: rows.map((r) => r.productId) });
}
