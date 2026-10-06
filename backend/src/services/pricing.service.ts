import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

// Set by an administrator in Settings → Payment Details → Shipping (stored as the "shipping" content section).
// Until someone sets it, shipping is free: nothing changes for customers by default.
export type ShippingRule = { flat: number; freeOver: number | null };

const wholePesos = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100_000 ? v : null);

export async function getShippingRule(db: Db = prisma): Promise<ShippingRule> {
  const row = await db.contentSection.findUnique({ where: { key: "shipping" } });
  const data = (row?.data ?? {}) as { flat?: unknown; freeOver?: unknown };
  return { flat: wholePesos(data.flat) ?? 0, freeOver: wholePesos(data.freeOver) };
}

export function shippingFor(rule: ShippingRule, subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (rule.freeOver !== null && subtotal >= rule.freeOver) return 0;
  return rule.flat;
}
