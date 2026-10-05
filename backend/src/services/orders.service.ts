import { randomUUID } from "node:crypto";
import { OrderStatus, Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { adjustStockTx } from "./stock.service";
import { Actor, recordOrderStatus, SYSTEM_ACTOR } from "./audit.service";

export const orderInclude = {
  items: { include: { size: { select: { label: true } } }, orderBy: { id: "asc" } },
  // Never the image bytes — those are fetched one at a time, behind an access check.
  paymentProofs: {
    select: { id: true, status: true, method: true, reference: true, note: true, rejectReason: true, reviewedBy: true, reviewedAt: true, createdAt: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  },
} satisfies Prisma.OrderInclude;
export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export type CartLineInput = { productId: number; sizeId?: number | null; qty: number };

// Stock policy: units are taken when the order is PLACED (not when paid) and returned if the order is cancelled
// while still PENDING or PAID. Simple and oversell-proof, but an unpaid order holds stock until it is cancelled, so
// cancelStaleUnpaidOrders (below) releases orders nobody pays for. Orders with a screenshot awaiting review are exempt.

// Allowed status moves; anything else is rejected. DELIVERED and CANCELLED are final.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

type PricedLine = {
  productId: number;
  sizeId: number | null;
  qty: number;
  name: string;
  sizeLabel: string | null;
  unitPrice: number;
  available: number;
};

// Prices and availability always come from the database, never from the client.
async function priceLines(db: Prisma.TransactionClient | typeof prisma, lines: CartLineInput[]): Promise<PricedLine[]> {
  const merged = new Map<string, { productId: number; sizeId: number | null; qty: number }>();
  for (const l of lines) {
    const key = `${l.productId}:${l.sizeId ?? ""}`;
    const prev = merged.get(key);
    merged.set(key, { productId: l.productId, sizeId: l.sizeId ?? null, qty: (prev?.qty ?? 0) + l.qty });
  }
  const products = await db.product.findMany({
    where: { id: { in: [...new Set([...merged.values()].map((l) => l.productId))] } },
    include: { sizes: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  // Sorted so concurrent checkouts always touch stock rows in the same order (avoids deadlocks).
  return [...merged.values()]
    .sort((a, b) => a.productId - b.productId || (a.sizeId ?? 0) - (b.sizeId ?? 0))
    .map((l) => {
      const product = byId.get(l.productId);
      if (!product) throw new HttpError(404, `Product ${l.productId} is no longer available`);
      if (product.sizes.length > 0) {
        const size = product.sizes.find((s) => s.id === l.sizeId);
        if (!size) throw new HttpError(400, `Choose a size for "${product.name}"`);
        return { ...l, name: product.name, sizeLabel: size.label, unitPrice: size.price, available: size.stock };
      }
      if (l.sizeId !== null) throw new HttpError(400, `"${product.name}" has no sizes`);
      return { ...l, name: product.name, sizeLabel: null, unitPrice: product.price, available: product.stock };
    });
}

export async function checkCart(lines: CartLineInput[]) {
  const priced = await priceLines(prisma, lines);
  return {
    ok: priced.every((l) => l.qty <= l.available),
    items: priced.map((l) => ({
      productId: l.productId,
      sizeId: l.sizeId,
      name: l.name,
      sizeLabel: l.sizeLabel,
      unitPrice: l.unitPrice,
      qty: l.qty,
      available: l.available,
      ok: l.qty <= l.available,
    })),
  };
}

export async function createOrder(input: {
  actor: Actor;
  customerId: number;
  lines: CartLineInput[];
  shipName: string;
  shipEmail: string;
  shipAddress: string;
}): Promise<OrderWithItems> {
  return prisma.$transaction(async (tx) => {
    const priced = await priceLines(tx, input.lines);
    const total = priced.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

    const created = await tx.order.create({
      data: {
        number: `tmp-${randomUUID()}`,
        customerId: input.customerId,
        shipName: input.shipName,
        shipEmail: input.shipEmail,
        shipAddress: input.shipAddress,
        total,
        items: {
          create: priced.map((l) => ({
            productId: l.productId,
            sizeId: l.sizeId,
            productName: l.name,
            unitPrice: l.unitPrice,
            quantity: l.qty,
          })),
        },
      },
    });
    const number = `LM-${1000 + created.id}`;
    await tx.order.update({ where: { id: created.id }, data: { number } });
    await recordOrderStatus(tx, { orderId: created.id, from: null, to: "PENDING", actor: input.actor, note: "Order placed" });

    for (const l of priced) {
      try {
        await adjustStockTx(tx, {
          productId: l.productId,
          sizeId: l.sizeId,
          delta: -l.qty,
          reason: "SALE",
          orderId: created.id,
          note: `Order ${number}`,
        });
      } catch (err) {
        // The conditional UPDATE found too little stock; throwing rolls back the whole transaction, order included.
        if (err instanceof HttpError && err.status === 409) {
          const label = l.sizeLabel ? `${l.name} (${l.sizeLabel})` : l.name;
          throw new HttpError(409, l.available > 0 ? `Only ${l.available} left of "${label}"` : `"${label}" is out of stock`);
        }
        throw err;
      }
    }
    return tx.order.findUniqueOrThrow({ where: { id: created.id }, include: orderInclude });
  });
}

// Moves an order to a new status; cancelling returns its units to stock in the same transaction.
// The UPDATE is conditional on the status we read, so two simultaneous requests can't both apply (or double-restock).
export async function changeOrderStatus(number: string, to: OrderStatus, actor: Actor, note?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { number }, include: orderInclude });
    const isCustomer = actor.type === "CUSTOMER";
    if (!order || (isCustomer && order.customerId !== actor.id)) {
      throw new HttpError(404, "Order not found");
    }
    if (isCustomer && order.paymentProofs.some((p) => p.status === "PENDING")) {
      throw new HttpError(409, "Your payment is being verified, so this order can't be cancelled here. Please contact us.");
    }
    if (isCustomer && !(to === "CANCELLED" && order.status === "PENDING")) {
      throw new HttpError(409, "Only an unpaid order can be cancelled from your account");
    }
    if (!TRANSITIONS[order.status].includes(to)) {
      throw new HttpError(409, `A ${order.status.toLowerCase()} order can't be marked ${to.toLowerCase()}`);
    }
    const moved = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: to } });
    if (moved.count === 0) throw new HttpError(409, "This order was just updated — refresh and try again");
    await recordOrderStatus(tx, { orderId: order.id, from: order.status, to, actor, note });

    if (to === "PAID") {
      // Marked paid straight from the status control (cash, in person, or checked another way): any screenshot still
      // waiting is closed as approved so it doesn't linger in the review queue.
      await tx.paymentProof.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: actor.name },
      });
    }
    if (to === "CANCELLED") {
      // A screenshot still waiting for review would otherwise sit in the review queue forever.
      await tx.paymentProof.updateMany({
        where: { orderId: order.id, status: "PENDING" },
        data: { status: "REJECTED", rejectReason: "The order was cancelled", reviewedAt: new Date(), reviewedBy: actor.name },
      });
      for (const item of order.items) {
        await adjustStockTx(tx, {
          productId: item.productId,
          sizeId: item.sizeId,
          delta: item.quantity,
          reason: "RETURN",
          orderId: order.id,
          staffId: actor.type === "STAFF" ? (actor.id ?? null) : null,
          note: `Order ${order.number} cancelled`,
        });
      }
    }
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  });
}

// Unpaid orders hold stock (see the policy at the top), so ones nobody pays for are cancelled and their units released.
export const ORDER_HOLD_HOURS = Number(process.env.ORDER_HOLD_HOURS ?? 24);

export async function cancelStaleUnpaidOrders(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ORDER_HOLD_HOURS * 60 * 60 * 1000);
  const stale = await prisma.order.findMany({ where: { status: "PENDING", createdAt: { lt: cutoff }, paymentProofs: { none: { status: "PENDING" } } }, select: { number: true } });
  let cancelled = 0;
  for (const { number } of stale) {
    try {
      await changeOrderStatus(number, "CANCELLED", SYSTEM_ACTOR, "Unpaid past the hold window");
      cancelled++;
    } catch (err) {
      // Most likely it was paid or cancelled a moment ago (a 409); either way there's nothing left to do.
      if (!(err instanceof HttpError)) console.error("[orders] stale cancel failed", number, err);
    }
  }
  return cancelled;
}
