import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";

const createSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(3, "Say a little more").max(2000),
});

// "Marga Torres" -> "Marga T." so reviews don't expose full names.
function displayName(full: string): string {
  const [first, ...rest] = full.trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

function serialize(r: { id: number; productId: number; rating: number; text: string; createdAt: Date; customer: { name: string } }) {
  return { id: r.id, productId: r.productId, author: displayName(r.customer.name), rating: r.rating, text: r.text, date: r.createdAt.toISOString().slice(0, 10) };
}

export async function createReview(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request");
  const { productId, rating, text } = parsed.data;

  const review = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId }, select: { rating: true, ratingCount: true } });
    if (!product) throw new HttpError(404, "Product not found");
    if (await tx.review.findUnique({ where: { productId_customerId: { productId, customerId: req.customerId! } } })) {
      throw new HttpError(409, "You've already reviewed this product");
    }
    const created = await tx.review.create({ data: { productId, customerId: req.customerId!, rating, text }, include: { customer: { select: { name: true } } } });
    // Folded into the stored average (not recomputed from Review rows) so the catalogue's existing rating history survives.
    const count = product.ratingCount + 1;
    const average = Math.round(((product.rating * product.ratingCount + rating) / count) * 100) / 100;
    await tx.product.update({ where: { id: productId }, data: { rating: average, ratingCount: count } });
    return created;
  });
  res.status(201).json({ review: serialize(review) });
}

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export async function listForProduct(req: Request, res: Response) {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) throw new HttpError(404, "Product not found");
  const q = listQuery.safeParse(req.query);
  if (!q.success) throw new HttpError(400, q.error.issues[0]?.message ?? "Invalid request");
  const { page, pageSize } = q.data;

  const [total, rows] = await Promise.all([
    prisma.review.count({ where: { productId } }),
    prisma.review.findMany({
      where: { productId },
      include: { customer: { select: { name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({ total, page, pageSize, reviews: rows.map(serialize) });
}
