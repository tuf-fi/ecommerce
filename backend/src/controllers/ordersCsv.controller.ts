import type { Request, Response } from "express";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { z } from "zod";
import { OrderStatus } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { staffActor } from "../services/audit.service";
import { changeOrderStatus } from "../services/orders.service";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];
const MAX_EXPORT = 20_000;
const MAX_IMPORT_ROWS = 500;

// Customer-typed text (names, addresses) ends up in a spreadsheet; a cell starting with = + - @ would be run as a formula
// when the file is opened, so it is prefixed with an apostrophe to keep it plain text.
const safeCell = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

const exportQuery = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Every order (optionally for one status and/or a date range), not just the page loaded in the browser. The Order and Status
// columns are what the import below reads, so an exported file can be edited and imported back.
export async function exportOrders(req: Request, res: Response) {
  const q = exportQuery.safeParse(req.query);
  if (!q.success) throw new HttpError(400, q.error.issues[0]?.message ?? "Invalid request");
  const { status, from, to } = q.data;

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}) } } : {}),
    },
    include: { items: { include: { size: { select: { label: true } } }, orderBy: { id: "asc" } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_EXPORT,
  });

  const rows = orders.map((o) => ({
    Order: o.number,
    Date: o.createdAt.toISOString().slice(0, 10),
    Customer: safeCell(o.shipName),
    Email: safeCell(o.shipEmail),
    Address: safeCell(o.shipAddress),
    Items: safeCell(o.items.map((i) => `${i.quantity} x ${i.productName}${i.size ? ` (${i.size.label})` : ""}`).join("; ")),
    "Item count": o.items.reduce((s, i) => s + i.quantity, 0),
    Total: o.total,
    Status: o.status.charAt(0) + o.status.slice(1).toLowerCase(),
    "Payment method": o.paymentMethod ?? "",
    "Paid on": o.paidAt ? o.paidAt.toISOString().slice(0, 10) : "",
  }));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send("﻿" + stringify(rows, { header: true }));
}

// Bulk status changes from a spreadsheet, e.g. a courier's sheet or an edited export. Columns: Order, Status. Each row goes
// through exactly the same rules as changing the status by hand (allowed moves only, stock returned on cancellation, history
// and audit entries), and a row that can't be applied is reported instead of stopping the rest.
export async function importOrderStatuses(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, 'Upload a CSV file in the "file" field');
  let records: Record<string, string>[];
  try {
    records = parse(req.file.buffer, { bom: true, columns: (h: string[]) => h.map((x) => x.trim().toLowerCase()), skip_empty_lines: true, trim: true });
  } catch {
    throw new HttpError(400, "Could not read that CSV file");
  }
  if (records.length === 0) throw new HttpError(400, "That file has no data rows");
  if (records.length > MAX_IMPORT_ROWS) throw new HttpError(400, `Import at most ${MAX_IMPORT_ROWS} rows at a time`);
  if (!("order" in records[0]) || !("status" in records[0])) throw new HttpError(400, "The CSV needs two columns: Order and Status");

  const actor = staffActor(req.staff!);
  const skipped: string[] = [];
  let updated = 0;

  for (const [i, row] of records.entries()) {
    const n = i + 2;
    const number = (row["order"] ?? "").toUpperCase();
    const to = STATUSES.find((s) => s === (row["status"] ?? "").toUpperCase());
    if (!/^LM-\d{4,12}$/.test(number)) { skipped.push(`Row ${n}: "${row["order"]}" isn't an order number.`); continue; }
    if (!to) { skipped.push(`Row ${n}: ${number} has an unknown status "${row["status"]}".`); continue; }

    const current = await prisma.order.findUnique({ where: { number }, select: { status: true } });
    if (!current) { skipped.push(`Row ${n}: ${number} doesn't exist.`); continue; }
    if (current.status === to) { skipped.push(`Row ${n}: ${number} is already ${to.toLowerCase()}.`); continue; }
    try {
      await changeOrderStatus(number, to, actor, "Status import");
      updated++;
    } catch (err) {
      if (err instanceof HttpError) skipped.push(`Row ${n}: ${number} — ${err.message}`);
      else throw err;
    }
  }
  res.json({ updated, skipped });
}
