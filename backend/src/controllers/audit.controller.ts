import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";

const query = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  entityType: z.string().trim().min(1).max(60).optional(),
  entityId: z.string().trim().min(1).max(60).optional(),
});

// Administrator-only: the full change trail across everything that records to AuditLog.
export async function listAuditLog(req: Request, res: Response) {
  const parsed = query.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid request");
  const { page, pageSize, entityType, entityId } = parsed.data;
  const where = { ...(entityType ? { entityType } : {}), ...(entityId ? { entityId } : {}) };

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  res.json({
    total,
    page,
    pageSize,
    items: rows.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      actor: { type: r.actorType, id: r.actorId, name: r.actorName },
      details: r.details,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

// Oldest first, so it reads as a timeline. Staff only (the customer-facing tracker already shows progress).
export async function orderHistory(req: Request, res: Response) {
  const order = await prisma.order.findUnique({ where: { number: String(req.params.no) }, select: { id: true } });
  if (!order) throw new HttpError(404, "Order not found");
  const rows = await prisma.orderStatusHistory.findMany({ where: { orderId: order.id }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  res.json({
    history: rows.map((h) => ({
      id: h.id,
      from: h.fromStatus,
      to: h.toStatus,
      actor: { type: h.actorType, id: h.actorId, name: h.actorName },
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
  });
}
