import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";

type Db = Prisma.TransactionClient | typeof prisma;

// The same answer for every reason a code fails, so codes can't be probed for what they once were.
const INVALID = "That code isn't valid";

export const normalizeCode = (code: string) => code.trim().toUpperCase();

type Customer = { id: number; email: string };

// Checks a code for this customer and works out the discount, without using it up.
export async function quoteVoucher(db: Db, rawCode: string, customer: Customer, subtotal: number) {
  const code = normalizeCode(rawCode);
  const v = await db.voucher.findUnique({ where: { code } });
  const usable =
    v &&
    v.active &&
    (!v.expiresAt || v.expiresAt > new Date()) &&
    (!v.forEmail || v.forEmail === customer.email) &&
    (v.maxUses === null || v.uses < v.maxUses) &&
    (v.percentOff ?? 0) > 0;
  if (!usable) throw new HttpError(400, INVALID);
  if (await db.voucherUse.findUnique({ where: { voucherId_customerId: { voucherId: v.id, customerId: customer.id } } })) {
    throw new HttpError(400, "You've already used this code");
  }
  const discount = Math.min(subtotal, Math.round((subtotal * v.percentOff!) / 100));
  return { voucher: v, discount };
}

// Uses the code up for real. Run inside the checkout transaction: the single conditional UPDATE means two orders racing
// for the last use can't both win, and if anything later in checkout fails (say, stock), the use is rolled back with it.
export async function redeemVoucher(tx: Prisma.TransactionClient, rawCode: string, customer: Customer, orderId: number) {
  const code = normalizeCode(rawCode);
  const claimed = await tx.$executeRaw`
    UPDATE "Voucher" SET uses = uses + 1
    WHERE code = ${code} AND active = true
      AND ("expiresAt" IS NULL OR "expiresAt" > now())
      AND ("forEmail" IS NULL OR "forEmail" = ${customer.email})
      AND ("maxUses" IS NULL OR uses < "maxUses")`;
  if (claimed === 0) throw new HttpError(409, INVALID);
  const voucher = await tx.voucher.findUniqueOrThrow({ where: { code } });
  try {
    await tx.voucherUse.create({ data: { voucherId: voucher.id, customerId: customer.id, orderId } });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") throw new HttpError(409, "You've already used this code");
    throw err;
  }
  return voucher;
}

// An unpaid order that is cancelled gives its code back.
export async function releaseVoucher(tx: Prisma.TransactionClient, orderId: number, code: string | null) {
  if (!code) return;
  const removed = await tx.voucherUse.deleteMany({ where: { orderId } });
  if (removed.count > 0) await tx.voucher.updateMany({ where: { code }, data: { uses: { decrement: 1 } } });
}
