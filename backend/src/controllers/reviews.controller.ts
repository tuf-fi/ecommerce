import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { sniffImage } from "../lib/imageSniff";
import { normalizeScreenshot } from "../lib/processImage";

export const MAX_REVIEW_PHOTOS = 4;

// Numbers are coerced because a review with a photo arrives as multipart form fields (strings).
const createSchema = z.object({
  productId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(3, "Say a little more").max(2000),
});

// "Marga Torres" -> "Marga T." so reviews don't expose full names.
function displayName(full: string): string {
  const [first, ...rest] = full.trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

function serialize(r: { id: number; productId: number; rating: number; text: string; photos: { id: number }[]; createdAt: Date; customer: { name: string } }) {
  return {
    id: r.id,
    productId: r.productId,
    author: displayName(r.customer.name),
    rating: r.rating,
    text: r.text,
    date: r.createdAt.toISOString().slice(0, 10),
    // Paths of the public image route, in the order they were attached; the website prefixes the API address.
    photos: r.photos.map((p) => `/reviews/${r.id}/photos/${p.id}`),
  };
}

export async function createReview(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request");
  const { productId, rating, text } = parsed.data;

  // Optional photos: trust the bytes, not the filename; re-encode each to drop EXIF and cap the size.
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length > MAX_REVIEW_PHOTOS) throw new HttpError(400, `Attach up to ${MAX_REVIEW_PHOTOS} photos`);
  const photos: { data: Buffer; mimeType: string }[] = [];
  for (const file of files) {
    if (!sniffImage(file.buffer)) throw new HttpError(400, "That file isn't a JPG, PNG or WEBP image");
    photos.push(
      await normalizeScreenshot(file.buffer).catch(() => {
        throw new HttpError(400, "We couldn't read one of those images. Try another photo");
      })
    );
  }

  const review = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId }, select: { rating: true, ratingCount: true } });
    if (!product) throw new HttpError(404, "Product not found");
    if (await tx.review.findUnique({ where: { productId_customerId: { productId, customerId: req.customerId! } } })) {
      throw new HttpError(409, "You've already reviewed this product");
    }
    const created = await tx.review.create({
      data: {
        productId,
        customerId: req.customerId!,
        rating,
        text,
        ...(photos.length ? { photos: { create: photos.map((p, position) => ({ position, mimeType: p.mimeType, data: new Uint8Array(p.data) })) } } : {}),
      },
      include: { customer: { select: { name: true } }, photos: { select: { id: true }, orderBy: { position: "asc" } } },
    });
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
      include: { customer: { select: { name: true } }, photos: { select: { id: true }, orderBy: { position: "asc" } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({ total, page, pageSize, reviews: rows.map(serialize) });
}

// Public: review photos are shown to every visitor. They never change once posted, so browsers may keep them.
export async function getReviewPhoto(req: Request, res: Response) {
  const reviewId = Number(req.params.id);
  const photoId = Number(req.params.photoId);
  if (!Number.isInteger(reviewId) || reviewId < 1 || !Number.isInteger(photoId) || photoId < 1) throw new HttpError(404, "Photo not found");
  const photo = await prisma.reviewPhoto.findFirst({ where: { id: photoId, reviewId } });
  if (!photo) throw new HttpError(404, "Photo not found");
  res.set({
    "Content-Type": photo.mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    // The site and the API live on different origins; helmet's default same-origin policy would block the <img>.
    "Cross-Origin-Resource-Policy": "cross-origin",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(Buffer.from(photo.data));
}
