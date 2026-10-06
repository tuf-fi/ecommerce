import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { subscribe } from "../lib/notificationBus";
import { HttpError } from "../lib/httpError";
import { notifyCustomer } from "../services/customerNotifications.service";

export const markReadSchema = z.object({ ids: z.array(z.number().int().positive()).max(200).optional() });

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(50),
});

// Newest first. The bell asks for the default (latest 50); the Notifications page asks for 10 at a time.
export async function listMine(req: Request, res: Response) {
  const customerId = req.customerId!;
  const q = listQuery.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: "Invalid request" });
  const { page, pageSize } = q.data;
  const [rows, unread, total] = await Promise.all([
    prisma.customerNotification.findMany({ where: { customerId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.customerNotification.count({ where: { customerId, readAt: null } }),
    prisma.customerNotification.count({ where: { customerId } }),
  ]);
  res.json({
    total,
    page,
    pageSize,
    unread,
    notifications: rows.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, href: n.href, read: n.readAt !== null, createdAt: n.createdAt.toISOString() })),
  });
}

// No ids = mark everything read.
export async function markRead(req: Request, res: Response) {
  const { ids } = req.body as z.infer<typeof markReadSchema>;
  await prisma.customerNotification.updateMany({
    where: { customerId: req.customerId!, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
}

// Server-sent events: the browser keeps this open and a new notification arrives the moment it is created.
export function stream(req: Request, res: Response) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.write("retry: 5000\n\n");
  const unsubscribe = subscribe(req.customerId!, res);
  // A comment line every 25s stops proxies from closing an idle connection.
  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 25_000);
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
}

// Development and staging only: lets the on-screen test button push a sample notification through the real pipeline.
export const testAllowed = () => process.env.NODE_ENV !== "production" || process.env.APP_ENV === "staging";

const SAMPLES = [
  { type: "order", title: "LM-1042 is on its way", body: "Your order has been handed over for delivery.", href: "/account/purchases" },
  { type: "order", title: "Payment confirmed for LM-1042", body: "We're preparing your order for shipping.", href: "/account/purchases" },
  { type: "voucher", title: "New discount code: TESTCODE10", body: "10% off your order. Valid until the end of the month.", href: "/account/vouchers" },
  { type: "account", title: "Your password was changed", body: "Your other devices were signed out. If this wasn't you, reset your password and contact us.", href: "/account/password" },
  { type: "account", title: "Profile updated", body: "Your name was updated.", href: "/account" },
] as const;

export async function sendTest(req: Request, res: Response) {
  if (!testAllowed()) throw new HttpError(404, "Not found");
  const sample = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
  await notifyCustomer(req.customerId!, { ...sample, title: `[Test] ${sample.title}` });
  res.json({ ok: true });
}
