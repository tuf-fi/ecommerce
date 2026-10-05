import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { customerActor, staffActor } from "../services/audit.service";
import { changeOrderStatus, checkCart, createOrder, orderInclude, OrderWithItems } from "../services/orders.service";

function serialize(o: OrderWithItems) {
  return {
    no: o.number,
    status: o.status,
    customerName: o.shipName,
    email: o.shipEmail,
    address: o.shipAddress,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    // none: nothing sent yet · review: a screenshot is waiting for staff · rejected: the last one was refused · approved: verified
    payment: {
      state: !o.paymentProofs[0] ? "none" : o.paymentProofs[0].status === "PENDING" ? "review" : o.paymentProofs[0].status === "REJECTED" ? "rejected" : "approved",
      proofs: o.paymentProofs.map((p) => ({
        id: p.id,
        status: p.status,
        method: p.method,
        reference: p.reference,
        note: p.note,
        rejectReason: p.rejectReason,
        reviewedBy: p.reviewedBy,
        reviewedAt: p.reviewedAt ? p.reviewedAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
      })),
    },
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.productName,
      sizeLabel: i.size?.label ?? null,
      qty: i.quantity,
      unitPrice: i.unitPrice,
    })),
  };
}

function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(400, issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request");
  }
  return parsed.data;
}

const line = z.object({
  productId: z.number().int().positive(),
  sizeId: z.number().int().positive().nullish(),
  qty: z.number().int().min(1).max(50),
});
const lines = z.array(line).min(1, "Your bag is empty").max(50);

const statuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const checkSchema = z.object({ items: lines });
const createSchema = z.object({
  items: lines,
  address: z.string().trim().min(5, "Choose a delivery address").max(500),
  name: z.string().trim().min(1).max(100).optional(),
});
const statusSchema = z.object({ status: z.enum(statuses) });
const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(statuses).optional(),
});

export async function cartCheck(req: Request, res: Response) {
  const { items } = parseBody(checkSchema, req.body);
  res.json(await checkCart(items));
}

export async function placeOrder(req: Request, res: Response) {
  const d = parseBody(createSchema, req.body);
  const customer = await prisma.customer.findUnique({ where: { id: req.customerId } });
  if (!customer) throw new HttpError(401, "Not signed in");
  const order = await createOrder({
    actor: customerActor(customer),
    customerId: customer.id,
    lines: d.items,
    shipName: d.name ?? customer.name,
    shipEmail: customer.email,
    shipAddress: d.address,
  });
  res.status(201).json({ order: serialize(order) });
}

async function listPage(res: Response, where: object, q: { page: number; pageSize: number }) {
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  res.json({ total, page: q.page, pageSize: q.pageSize, orders: rows.map(serialize) });
}

export async function myOrders(req: Request, res: Response) {
  await listPage(res, { customerId: req.customerId }, parseBody(listQuery, req.query));
}

export async function allOrders(req: Request, res: Response) {
  const q = parseBody(listQuery, req.query);
  await listPage(res, q.status ? { status: q.status } : {}, q);
}

export async function cancelMyOrder(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({ where: { id: req.customerId }, select: { id: true, name: true } });
  if (!customer) throw new HttpError(401, "Not signed in");
  const order = await changeOrderStatus(String(req.params.no), "CANCELLED", customerActor(customer), "Cancelled by customer");
  res.json({ order: serialize(order) });
}

export async function setStatus(req: Request, res: Response) {
  const { status } = parseBody(statusSchema, req.body);
  const order = await changeOrderStatus(String(req.params.no), status, staffActor(req.staff!));
  res.json({ order: serialize(order) });
}
