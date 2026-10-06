import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { canAccess } from "../lib/sections";

const DEFAULT_LOW_STOCK = 8;
const FEED_LIMIT = 40;

// ---- customers (the admin "Users" list) -------------------------------------------------------------------------------------

const customerQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(100).optional(),
});

export async function listCustomers(req: Request, res: Response) {
  const q = customerQuery.safeParse(req.query);
  if (!q.success) throw new HttpError(400, q.error.issues[0]?.message ?? "Invalid request");
  const { page, pageSize, search } = q.data;
  // The placeholder reviewer accounts behind the imported sample reviews aren't customers.
  const where = {
    NOT: { email: { endsWith: "@reviewers.invalid" } },
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      select: { id: true, name: true, email: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  res.json({ total, page, pageSize, customers: rows.map((c) => ({ id: c.id, name: c.name, email: c.email, createdAt: c.createdAt.toISOString(), orders: c._count.orders })) });
}

// ---- newsletter subscribers and Contact-form messages ---------------------------------------------------------------------------

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(100).optional(),
});

function parseList(req: Request) {
  const q = listQuery.safeParse(req.query);
  if (!q.success) throw new HttpError(400, q.error.issues[0]?.message ?? "Invalid request");
  return q.data;
}

export async function listSubscribers(req: Request, res: Response) {
  const { page, pageSize, search } = parseList(req);
  const where = search ? { email: { contains: search, mode: "insensitive" as const } } : {};
  const [total, rows] = await Promise.all([
    prisma.subscriber.count({ where }),
    prisma.subscriber.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  res.json({ total, page, pageSize, subscribers: rows.map((s) => ({ id: s.id, email: s.email, source: s.source, createdAt: s.createdAt.toISOString() })) });
}

export async function listMessages(req: Request, res: Response) {
  const { page, pageSize, search } = parseList(req);
  const where = search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }, { message: { contains: search, mode: "insensitive" as const } }] } : {};
  const [total, rows] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  res.json({ total, page, pageSize, messages: rows.map((m) => ({ id: m.id, name: m.name, email: m.email, message: m.message, createdAt: m.createdAt.toISOString() })) });
}

// ---- notifications --------------------------------------------------------------------------------------------------------

type Item = { key: string; type: "order" | "inventory"; text: string; at: Date; ref?: string };

// Worst-size judgement, the same rule the stock badges use.
function stockLevel(p: { stock: number; reorderThreshold: number | null; sizes: { stock: number; reorderThreshold: number | null }[] }): "out" | "low" | null {
  const units = p.sizes.length
    ? p.sizes.map((s) => ({ stock: s.stock, threshold: s.reorderThreshold ?? p.reorderThreshold ?? DEFAULT_LOW_STOCK }))
    : [{ stock: p.stock, threshold: p.reorderThreshold ?? DEFAULT_LOW_STOCK }];
  if (units.some((u) => u.stock <= 0)) return "out";
  if (units.some((u) => u.stock <= u.threshold)) return "low";
  return null;
}

// What needs attention right now, worked out from live data rather than stored: new orders, payment screenshots waiting for
// review, and products that are low or out of stock. Only the "seen" marks are stored, per staff member.
async function buildFeed(staff: NonNullable<Request["staff"]>): Promise<Item[]> {
  const items: Item[] = [];

  if (canAccess(staff, "orders")) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [recent, toReview] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gt: since } }, select: { number: true, shipName: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.paymentProof.findMany({ where: { status: "PENDING" }, select: { id: true, createdAt: true, order: { select: { number: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    ]);
    for (const o of recent) items.push({ key: `order:${o.number}`, type: "order", text: `New order ${o.number} from ${o.shipName}`, at: o.createdAt, ref: o.number });
    for (const p of toReview) items.push({ key: `proof:${p.id}`, type: "order", text: `Payment screenshot to review for ${p.order.number}`, at: p.createdAt, ref: p.order.number });
  }

  if (canAccess(staff, "inventory")) {
    const products = await prisma.product.findMany({ select: { id: true, name: true, stock: true, reorderThreshold: true, updatedAt: true, sizes: { select: { stock: true, reorderThreshold: true } } } });
    for (const p of products) {
      const level = stockLevel(p);
      if (level) items.push({ key: `stock:${p.id}:${level}`, type: "inventory", text: level === "out" ? `${p.name} is out of stock` : `${p.name} is running low`, at: p.updatedAt, ref: p.name });
    }
  }
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, FEED_LIMIT);
}

export async function listNotifications(req: Request, res: Response) {
  const feed = await buildFeed(req.staff!);
  const seen = new Set((await prisma.notificationRead.findMany({ where: { staffId: req.staff!.id, key: { in: feed.map((i) => i.key) } }, select: { key: true } })).map((r) => r.key));
  res.json({ notifications: feed.map((i) => ({ id: i.key, type: i.type, text: i.text, createdAt: i.at.toISOString(), read: seen.has(i.key), ref: i.ref })) });
}

export const markReadSchema = z.union([z.object({ all: z.literal(true) }), z.object({ keys: z.array(z.string().max(100)).min(1).max(100) })]);

export async function markNotificationsRead(req: Request, res: Response) {
  const body = req.body as z.infer<typeof markReadSchema>;
  const keys = "all" in body ? (await buildFeed(req.staff!)).map((i) => i.key) : body.keys;
  if (keys.length > 0) {
    await prisma.notificationRead.createMany({ data: keys.map((key) => ({ staffId: req.staff!.id, key })), skipDuplicates: true });
  }
  res.json({ ok: true });
}

// ---- a customer's own voucher codes -----------------------------------------------------------------------------------------

export async function myVouchers(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({ where: { id: req.customerId }, select: { email: true } });
  if (!customer) throw new HttpError(401, "Not signed in");
  const rows = await prisma.voucher.findMany({
    // Personal codes that haven't been used yet (any use ends a single-use code).
    where: { forEmail: customer.email, active: true, redemptions: { none: {} }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    orderBy: { id: "desc" },
  });
  res.json({ vouchers: rows.map((v) => ({ code: v.code, description: v.description, percentOff: v.percentOff, expiresAt: v.expiresAt ? v.expiresAt.toISOString() : null })) });
}
