import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { record, staffActor } from "../services/audit.service";

// Section key -> the JSON shape it must have. Mirrors the sections the admin CMS edits.
const SHAPES = {
  visibility: "object",
  hero: "object",
  about: "object",
  contact: "object",
  philosophy: "object",
  newsletter: "object",
  contactInfo: "object",
  socialLinks: "object",
  pageIntros: "object",
  // How customers pay (GCash/Maya numbers, bank details, instructions); edited in Admin → Settings → Payment Details.
  paymentInstructions: "object",
  navLinks: "array",
  footerShopLinks: "array",
  footerCompanyLinks: "array",
  faqs: "array",
  blogPosts: "array",
  pages: "array",
  promos: "array",
  testimonials: "array",
  rituals: "array",
  concerns: "array",
} as const;
type SectionKey = keyof typeof SHAPES;

const isSection = (k: string): k is SectionKey => Object.hasOwn(SHAPES, k);
const MAX_BYTES = 500_000;
const MAX_DEPTH = 8;

// Embedded base64 images would bloat every page load; images must be uploaded and stored as URLs instead.
function assertSafe(value: unknown, depth = 0): void {
  if (depth > MAX_DEPTH) throw new HttpError(400, "Content is nested too deeply");
  if (typeof value === "string") {
    if (value.startsWith("data:")) throw new HttpError(400, "Upload images instead of embedding them in content");
  } else if (Array.isArray(value)) {
    value.forEach((v) => assertSafe(v, depth + 1));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => assertSafe(v, depth + 1));
  }
}

function sectionKey(req: Request): SectionKey {
  const key = String(req.params.section);
  if (!isSection(key)) throw new HttpError(404, "Unknown content section");
  return key;
}

// Everything the storefront needs to render, in one call. Only sections an admin has saved appear; the frontend keeps
// its built-in defaults for the rest.
export async function getAllContent(_req: Request, res: Response) {
  const rows = await prisma.contentSection.findMany();
  res.json({ sections: Object.fromEntries(rows.map((r) => [r.key, r.data])) });
}

export async function getContent(req: Request, res: Response) {
  const row = await prisma.contentSection.findUnique({ where: { key: sectionKey(req) } });
  if (!row) throw new HttpError(404, "Nothing saved for this section yet");
  res.json({ section: row.key, data: row.data, updatedAt: row.updatedAt.toISOString() });
}

export async function saveContent(req: Request, res: Response) {
  const key = sectionKey(req);
  // Whoever can edit these can change where customers send their money, so it is limited to administrators.
  if (key === "paymentInstructions" && req.staff?.role !== "ADMINISTRATOR") throw new HttpError(403, "Only administrators can change payment details");
  const data: unknown = req.body?.data;
  const isArray = Array.isArray(data);
  if (data === null || typeof data !== "object" || isArray !== (SHAPES[key] === "array")) {
    throw new HttpError(400, `"${key}" must be ${SHAPES[key] === "array" ? "an array" : "an object"}`);
  }
  const bytes = Buffer.byteLength(JSON.stringify(data));
  if (bytes > MAX_BYTES) throw new HttpError(413, "That content is too large");
  assertSafe(data);

  const row = await prisma.$transaction(async (tx) => {
    const saved = await tx.contentSection.upsert({
      where: { key },
      create: { key, data: data as Prisma.InputJsonValue },
      update: { data: data as Prisma.InputJsonValue },
    });
    await record(tx, {
      entityType: "content",
      entityId: key,
      action: "update",
      actor: staffActor(req.staff!),
      // For payment details the account numbers themselves are logged, so a swapped number can always be traced.
      details:
        key === "paymentInstructions"
          ? { bytes, accounts: ((data as { methods?: { id?: string; accountNumber?: string }[] }).methods ?? []).map((m) => `${m.id}: ${m.accountNumber}`) }
          : { bytes, items: isArray ? (data as unknown[]).length : undefined },
    });
    return saved;
  });
  res.json({ section: row.key, updatedAt: row.updatedAt.toISOString() });
}
