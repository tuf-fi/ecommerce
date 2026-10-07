import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { z } from "zod";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { adjustStock, adjustStockTx } from "../services/stock.service";
import { record, staffActor } from "../services/audit.service";

export const CATEGORIES = ["Serum", "Treatment", "Moisturizer", "Body", "Sets"] as const;
const DEFAULT_LOW_STOCK = 8;

const include = { sizes: { orderBy: { id: "asc" } } } satisfies Prisma.ProductInclude;
type ProductWithSizes = Prisma.ProductGetPayload<{ include: typeof include }>;

// A discount only counts while it is below the regular price.
function activeSale(x: { price: number; salePrice: number | null }): number | null {
  return x.salePrice !== null && x.salePrice < x.price ? x.salePrice : null;
}

// The cheapest price a sized product starts from, when at least one size is discounted.
function lowestSale(sizes: { price: number; salePrice: number | null }[]): number | null {
  if (!sizes.some((s) => activeSale(s) !== null)) return null;
  return Math.min(...sizes.map((s) => activeSale(s) ?? s.price));
}

function serialize(p: ProductWithSizes, admin: boolean) {
  const hasSizes = p.sizes.length > 0;
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    description: p.description,
    price: hasSizes ? Math.min(...p.sizes.map((s) => s.price)) : p.price,
    // Lowest discounted rate across the product (or its sizes), or null when nothing is discounted.
    salePrice: hasSizes ? lowestSale(p.sizes) : activeSale(p),
    stock: hasSizes ? p.sizes.reduce((sum, s) => sum + s.stock, 0) : p.stock,
    rating: p.rating,
    ratingCount: p.ratingCount,
    image: p.image,
    concerns: p.concerns,
    sizes: p.sizes.map((s) => ({
      id: s.id,
      label: s.label,
      price: s.price,
      salePrice: activeSale(s),
      stock: s.stock,
      ...(admin ? { reorderThreshold: s.reorderThreshold } : {}),
    })),
    // Internal fields are only sent to authenticated staff.
    ...(admin ? { expiry: p.expiry ? p.expiry.toISOString().slice(0, 10) : null, reorderThreshold: p.reorderThreshold, version: p.version } : {}),
  };
}

const idParam = z.coerce.number().int().positive();
function productId(req: Request) {
  const parsed = idParam.safeParse(req.params.id);
  if (!parsed.success) throw new HttpError(404, "Product not found");
  return parsed.data;
}

function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(400, issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request");
  }
  return parsed.data;
}

// Only same-site paths or http(s) URLs; base64 data URLs are rejected until the Cloudinary upload flow exists.
const imageUrl = z
  .string()
  .max(500)
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Must be a path or http(s) URL");
const nonNegInt = z.number().int().min(0).max(10_000_000);

const sizeInput = z.object({
  id: z.number().int().positive().optional(),
  label: z.string().trim().min(1).max(40),
  price: nonNegInt,
  salePrice: nonNegInt.nullable().optional(),
  // Initial stock for a brand-new size only; existing sizes change through stock-adjustment.
  stock: nonNegInt.optional(),
  reorderThreshold: nonNegInt.nullable().optional(),
});

const productFields = {
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(60),
  description: z.string().max(5000),
  price: nonNegInt,
  salePrice: nonNegInt.nullable(),
  reorderThreshold: nonNegInt.nullable(),
  expiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  image: imageUrl.nullable(),
  concerns: z.array(z.string().trim().min(1).max(60)).max(20),
  sizes: z.array(sizeInput).max(20),
};

const createSchema = z.object({
  ...productFields,
  sku: z.string().trim().min(1).max(60).optional(),
  description: productFields.description.default(""),
  price: productFields.price.default(0),
  salePrice: productFields.salePrice.optional(),
  stock: nonNegInt.default(0),
  reorderThreshold: productFields.reorderThreshold.optional(),
  expiry: productFields.expiry.optional(),
  image: productFields.image.optional(),
  concerns: productFields.concerns.default([]),
  sizes: productFields.sizes.default([]),
});

// `version` is the product version the edit was made against; if someone else saved since, the edit is rejected.
const updateSchema = z.object(productFields).partial().extend({ version: z.number().int().min(0) });

const adjustSchema = z.object({
  sizeId: z.number().int().positive().optional(),
  delta: z.number().int().refine((n) => n !== 0, "Must not be zero"),
  reason: z.enum(["RESTOCK", "CORRECTION", "DAMAGED", "EXPIRED", "RETURN"]),
  note: z.string().trim().max(500).optional(),
});

function assertValidSale(label: string, price: number, salePrice: number | null | undefined) {
  if (salePrice != null && salePrice >= price) throw new HttpError(400, `${label}: the discounted price must be lower than the regular price`);
}

function assertUniqueLabels(sizes: { label: string }[]) {
  const seen = new Set<string>();
  for (const s of sizes) {
    const key = s.label.trim().toLowerCase();
    if (seen.has(key)) throw new HttpError(400, `Duplicate size "${s.label}"`);
    seen.add(key);
  }
}

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(100),
});

async function productPage(req: Request, res: Response, admin: boolean) {
  const { page, pageSize } = parseBody(listQuery, req.query);
  const [total, products] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({ include, orderBy: { id: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  res.json({ total, page, pageSize, products: products.map((p) => serialize(p, admin)) });
}

export const listProducts = (req: Request, res: Response) => productPage(req, res, false);
export const listProductsAdmin = (req: Request, res: Response) => productPage(req, res, true);

export async function getProduct(req: Request, res: Response) {
  const product = await prisma.product.findUnique({ where: { id: productId(req) }, include });
  if (!product) throw new HttpError(404, "Product not found");
  res.json({ product: serialize(product, false) });
}

export async function createProduct(req: Request, res: Response) {
  const d = parseBody(createSchema, req.body);
  assertUniqueLabels(d.sizes);
  if (d.sizes.length) d.sizes.forEach((s) => assertValidSale(`Size "${s.label}"`, s.price, s.salePrice));
  else assertValidSale("Product", d.price, d.salePrice);
  const staffId = req.staff!.id;

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        sku: d.sku ?? `tmp-${randomUUID()}`,
        name: d.name,
        category: d.category,
        description: d.description,
        price: d.sizes.length ? Math.min(...d.sizes.map((s) => s.price)) : d.price,
        salePrice: d.sizes.length ? null : (d.salePrice ?? null),
        stock: d.sizes.length ? 0 : d.stock,
        reorderThreshold: d.reorderThreshold ?? null,
        expiry: d.expiry ? new Date(d.expiry) : null,
        image: d.image ?? null,
        concerns: d.concerns,
        sizes: {
          create: d.sizes.map((s) => ({ label: s.label, price: s.price, salePrice: s.salePrice ?? null, stock: s.stock ?? 0, reorderThreshold: s.reorderThreshold ?? null })),
        },
      },
      include,
    });
    const sku = d.sku ?? `LM-${String(created.id).padStart(4, "0")}`;
    if (!d.sku) await tx.product.update({ where: { id: created.id }, data: { sku } });
    await record(tx, { entityType: "product", entityId: created.id, action: "create", actor: staffActor(req.staff!), details: { name: d.name, sku } });

    const opening = created.sizes.length
      ? created.sizes.map((s) => ({ sizeId: s.id, quantity: s.stock }))
      : [{ sizeId: null, quantity: created.stock }];
    await tx.stockMovement.createMany({
      data: opening
        .filter((o) => o.quantity > 0)
        .map((o) => ({ productId: created.id, sizeId: o.sizeId, quantity: o.quantity, reason: "RESTOCK" as const, note: "Added to catalogue", staffId })),
    });
    return tx.product.findUniqueOrThrow({ where: { id: created.id }, include });
  });
  res.status(201).json({ product: serialize(product, true) });
}

// Edits details only. Stock never changes here — it goes through stock-adjustment so every change has a reason.
export async function updateProduct(req: Request, res: Response) {
  const id = productId(req);
  const d = parseBody(updateSchema, req.body);
  if (d.sizes) assertUniqueLabels(d.sizes);
  const staffId = req.staff!.id;

  const product = await prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id }, include });
    if (!existing) throw new HttpError(404, "Product not found");

    // The UPDATE only matches if the version is still the one this edit was based on. It also locks the row until the
    // transaction ends, so two editors saving at once can't both pass: the second one re-checks, finds the new
    // version, and is turned away instead of silently overwriting the first.
    const claimed = await tx.product.updateMany({ where: { id, version: d.version }, data: { version: { increment: 1 } } });
    if (claimed.count === 0) {
      throw new HttpError(409, "Someone else changed this product while you were editing. Reload it and apply your changes again.");
    }

    const data: Prisma.ProductUpdateInput = {};
    const changes: Record<string, unknown> = {};
    const track = (key: string, before: unknown, after: unknown) => {
      if (JSON.stringify(before) !== JSON.stringify(after)) changes[key] = { from: before, to: after };
    };
    if (d.name !== undefined) track("name", existing.name, d.name);
    if (d.category !== undefined) track("category", existing.category, d.category);
    if (d.description !== undefined && d.description !== existing.description) changes.description = "edited";
    if (d.price !== undefined) track("price", existing.price, d.price);
    if (d.salePrice !== undefined) track("salePrice", existing.salePrice, d.salePrice);
    if (d.reorderThreshold !== undefined) track("reorderThreshold", existing.reorderThreshold, d.reorderThreshold);
    if (d.expiry !== undefined) track("expiry", existing.expiry ? existing.expiry.toISOString().slice(0, 10) : null, d.expiry);
    if (d.image !== undefined) track("image", existing.image, d.image);
    if (d.concerns !== undefined) track("concerns", existing.concerns, d.concerns);
    if (d.name !== undefined) data.name = d.name;
    if (d.category !== undefined) data.category = d.category;
    if (d.description !== undefined) data.description = d.description;
    if (d.price !== undefined) data.price = d.price;
    if (d.salePrice !== undefined) data.salePrice = d.salePrice;
    if (d.salePrice != null || d.price !== undefined) assertValidSale("Product", d.price ?? existing.price, d.salePrice !== undefined ? d.salePrice : existing.salePrice);
    if (d.reorderThreshold !== undefined) data.reorderThreshold = d.reorderThreshold;
    if (d.expiry !== undefined) data.expiry = d.expiry ? new Date(d.expiry) : null;
    if (d.image !== undefined) data.image = d.image;
    if (d.concerns !== undefined) data.concerns = d.concerns;

    if (d.sizes) {
      const existingIds = new Set(existing.sizes.map((s) => s.id));
      const sizeSummary = (list: { label: string; price: number; salePrice?: number | null }[]) =>
        list.map((s) => `${s.label}@${s.price}${s.salePrice != null ? `->${s.salePrice}` : ""}`).sort();
      track("sizes", sizeSummary(existing.sizes), sizeSummary(d.sizes));
      d.sizes.forEach((s) => assertValidSale(`Size "${s.label}"`, s.price, s.salePrice));
      const keep = new Set(d.sizes.filter((s) => s.id !== undefined).map((s) => s.id!));
      for (const s of d.sizes) {
        if (s.id !== undefined && !existingIds.has(s.id)) throw new HttpError(400, `Size ${s.id} does not belong to this product`);
      }

      for (const old of existing.sizes) {
        if (keep.has(old.id)) continue;
        const used = await tx.orderItem.count({ where: { sizeId: old.id } });
        if (used > 0) throw new HttpError(409, `Size "${old.label}" has orders and can't be removed`);
        await tx.productSize.delete({ where: { id: old.id } });
      }
      for (const s of d.sizes) {
        if (s.id !== undefined) {
          await tx.productSize.update({
            where: { id: s.id },
            data: { label: s.label, price: s.price, salePrice: s.salePrice ?? null, ...(s.reorderThreshold !== undefined ? { reorderThreshold: s.reorderThreshold } : {}) },
          });
        } else {
          const added = await tx.productSize.create({
            data: { productId: id, label: s.label, price: s.price, salePrice: s.salePrice ?? null, stock: s.stock ?? 0, reorderThreshold: s.reorderThreshold ?? null },
          });
          if (added.stock > 0) {
            await tx.stockMovement.create({
              data: { productId: id, sizeId: added.id, quantity: added.stock, reason: "RESTOCK", note: "Size added", staffId },
            });
          }
        }
      }
      // Base stock is only meaningful without sizes; log what's discarded when the first size appears.
      if (existing.sizes.length === 0 && d.sizes.length > 0 && existing.stock > 0) {
        await tx.stockMovement.create({
          data: { productId: id, quantity: -existing.stock, reason: "CORRECTION", note: "Converted to size variants", staffId },
        });
        data.stock = 0;
      }
      if (d.sizes.length > 0) {
        data.price = Math.min(...d.sizes.map((s) => s.price));
        data.salePrice = null;
      }
    }

    await tx.product.update({ where: { id }, data });
    if (Object.keys(changes).length > 0) {
      await record(tx, { entityType: "product", entityId: id, action: "update", actor: staffActor(req.staff!), details: changes as Prisma.InputJsonValue });
    }
    return tx.product.findUniqueOrThrow({ where: { id }, include });
  });
  res.json({ product: serialize(product, true) });
}

export async function deleteProduct(req: Request, res: Response) {
  const id = productId(req);
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id }, select: { name: true, sku: true } });
    if (!product) throw new HttpError(404, "Product not found");
    if ((await tx.orderItem.count({ where: { productId: id } })) > 0) throw new HttpError(409, "This product has orders and can't be deleted");
    await tx.product.delete({ where: { id } });
    await record(tx, { entityType: "product", entityId: id, action: "delete", actor: staffActor(req.staff!), details: product });
  });
  res.json({ ok: true });
}

export async function stockAdjustment(req: Request, res: Response) {
  const id = productId(req);
  const d = parseBody(adjustSchema, req.body);
  await adjustStock({ productId: id, sizeId: d.sizeId, delta: d.delta, reason: d.reason, note: d.note, staffId: req.staff!.id });
  const product = await prisma.product.findUniqueOrThrow({ where: { id }, include });
  res.json({ product: serialize(product, true) });
}

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

async function stockLogPage(req: Request, res: Response, productIdFilter?: number) {
  const { page, pageSize } = parseBody(pageQuery, req.query);
  const where = productIdFilter ? { productId: productIdFilter } : {};
  const [total, rows] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { product: { select: { name: true } }, size: { select: { label: true } }, staff: { select: { name: true } } },
    }),
  ]);
  res.json({
    total,
    page,
    pageSize,
    items: rows.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product.name,
      sizeLabel: m.size?.label ?? null,
      quantity: m.quantity,
      reason: m.reason,
      note: m.note,
      actor: m.staff?.name ?? "System",
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export const stockLogAll = (req: Request, res: Response) => stockLogPage(req, res);
export async function stockLogForProduct(req: Request, res: Response) {
  const id = productId(req);
  if (!(await prisma.product.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Product not found");
  return stockLogPage(req, res, id);
}

function worstStatus(p: ProductWithSizes): "in" | "low" | "out" {
  const units = p.sizes.length
    ? p.sizes.map((s) => ({ stock: s.stock, threshold: s.reorderThreshold ?? p.reorderThreshold ?? DEFAULT_LOW_STOCK }))
    : [{ stock: p.stock, threshold: p.reorderThreshold ?? DEFAULT_LOW_STOCK }];
  if (units.some((u) => u.stock <= 0)) return "out";
  if (units.some((u) => u.stock <= u.threshold)) return "low";
  return "in";
}

export async function exportCsv(_req: Request, res: Response) {
  const products = await prisma.product.findMany({ include, orderBy: { id: "asc" }, take: 5000 });
  const rows = products.map((p) => {
    const s = serialize(p, false);
    const prices = p.sizes.length ? p.sizes.map((x) => x.price) : [p.price];
    return {
      "Product name": s.name,
      SKU: s.sku,
      Category: s.category,
      "Price Min": Math.min(...prices),
      "Price Max": Math.max(...prices),
      "Sale Price": s.salePrice ?? "",
      Stock: s.stock,
      Status: worstStatus(p),
    };
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="inventory.csv"');
  res.send(stringify(rows, { header: true }));
}

// Same columns as the admin UI's client-side import; every row is re-validated here regardless.
export async function importCsv(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, 'Upload a CSV file in the "file" field');
  let records: Record<string, string>[];
  try {
    records = parse(req.file.buffer, { columns: (h: string[]) => h.map((x) => x.trim().toLowerCase()), skip_empty_lines: true, trim: true });
  } catch {
    throw new HttpError(400, "Could not read that CSV file");
  }
  if (records.length === 0) throw new HttpError(400, "That file has no data rows");
  if (records.length > 1000) throw new HttpError(400, "Import at most 1000 rows at a time");
  const required = ["product name", "sku", "category", "price min", "stock"];
  const missing = required.filter((c) => !(c in records[0]));
  if (missing.length) throw new HttpError(400, `CSV is missing column(s): ${missing.join(", ")}`);

  const staffId = req.staff!.id;
  const taken = new Set((await prisma.product.findMany({ select: { sku: true } })).map((p) => p.sku.toLowerCase()));
  const skipped: string[] = [];
  let created = 0;

  for (const [i, row] of records.entries()) {
    const n = i + 2;
    const name = row["product name"];
    const sku = row["sku"];
    const category = CATEGORIES.find((c) => c.toLowerCase() === row["category"]?.toLowerCase());
    const price = Number(row["price min"]);
    const stock = Number(row["stock"]);
    const saleRaw = row["sale price"]?.trim();
    const salePrice = saleRaw ? Number(saleRaw) : null;
    if (!name) { skipped.push(`Row ${n}: missing product name.`); continue; }
    if (!sku) { skipped.push(`Row ${n}: missing SKU.`); continue; }
    if (taken.has(sku.toLowerCase())) { skipped.push(`Row ${n}: SKU "${sku}" already exists.`); continue; }
    if (!category) { skipped.push(`Row ${n}: unrecognized category "${row["category"]}".`); continue; }
    if (!Number.isInteger(price) || price <= 0) { skipped.push(`Row ${n}: invalid price.`); continue; }
    if (!Number.isInteger(stock) || stock < 0) { skipped.push(`Row ${n}: invalid stock.`); continue; }
    if (salePrice !== null && (!Number.isInteger(salePrice) || salePrice < 0 || salePrice >= price)) { skipped.push(`Row ${n}: sale price must be lower than the price.`); continue; }
    taken.add(sku.toLowerCase());
    await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({ data: { sku, name, category, price, salePrice, stock: 0 } });
      if (stock > 0) await adjustStockTx(tx, { productId: p.id, delta: stock, reason: "IMPORT", note: "CSV import", staffId });
    });
    created++;
  }
  res.json({ created, skipped });
}
