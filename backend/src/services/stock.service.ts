import { Prisma, StockReason } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";

export type StockAdjustment = {
  productId: number;
  sizeId?: number | null;
  delta: number;
  reason: StockReason;
  note?: string | null;
  staffId?: number | null;
  orderId?: number | null;
};

// The only code path that changes stock. The decrement is a single conditional UPDATE, so two concurrent
// requests can never both take the last unit (the database serializes them), and a StockMovement row is
// written in the same transaction. Pass an existing `tx` to make it part of a larger transaction (e.g. checkout).
export async function adjustStockTx(tx: Prisma.TransactionClient, input: StockAdjustment) {
  const { productId, delta, reason, note = null, staffId = null, orderId = null } = input;
  const sizeId = input.sizeId ?? null;
  if (!Number.isInteger(delta) || delta === 0) throw new HttpError(400, "Quantity change must be a non-zero whole number");

  const product = await tx.product.findUnique({ where: { id: productId }, select: { sizes: { select: { id: true } } } });
  if (!product) throw new HttpError(404, "Product not found");
  if (product.sizes.length > 0 && sizeId === null) throw new HttpError(400, "This product has sizes — choose one");
  if (product.sizes.length === 0 && sizeId !== null) throw new HttpError(400, "This product has no sizes");
  if (sizeId !== null && !product.sizes.some((s) => s.id === sizeId)) throw new HttpError(404, "Size not found");

  const guard = delta < 0 ? { stock: { gte: -delta } } : {};
  const result =
    sizeId !== null
      ? await tx.productSize.updateMany({ where: { id: sizeId, productId, ...guard }, data: { stock: { increment: delta } } })
      : await tx.product.updateMany({ where: { id: productId, ...guard }, data: { stock: { increment: delta } } });
  if (result.count === 0) throw new HttpError(409, "Not enough stock");

  await tx.stockMovement.create({ data: { productId, sizeId, quantity: delta, reason, note, staffId, orderId } });
}

export function adjustStock(input: StockAdjustment) {
  return prisma.$transaction((tx) => adjustStockTx(tx, input));
}
