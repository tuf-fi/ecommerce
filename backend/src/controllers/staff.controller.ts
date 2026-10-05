import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { ACCESS_LEVELS } from "../lib/sections";
import { record, staffActor } from "../services/audit.service";
import { revokeStaffSessions } from "../services/adminSession.service";

const email = z.string().trim().toLowerCase().email().max(200);
const photo = z.string().max(500).refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Photo must be an uploaded image").nullable();

export const createStaffSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  role: z.enum(["ADMINISTRATOR", "STAFF"]),
  access: z.enum(ACCESS_LEVELS),
  password: z.string().min(8, "Use at least 8 characters").max(200),
  photo: photo.optional(),
});

export const updateStaffSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email,
    role: z.enum(["ADMINISTRATOR", "STAFF"]),
    access: z.enum(ACCESS_LEVELS),
    photo,
    active: z.boolean(),
    // Sets a new password for them (e.g. they forgot theirs).
    password: z.string().min(8, "Use at least 8 characters").max(200),
    // Turns their two-factor off (e.g. they lost their phone and recovery codes).
    resetTwoFactor: z.literal(true),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

const select = {
  id: true,
  name: true,
  email: true,
  role: true,
  access: true,
  photo: true,
  active: true,
  totpEnabled: true,
  createdAt: true,
} satisfies Prisma.StaffMemberSelect;
type Row = Prisma.StaffMemberGetPayload<{ select: typeof select }>;

function serialize(s: Row) {
  return { id: s.id, name: s.name, email: s.email, role: s.role, access: s.access, photo: s.photo, active: s.active, twoFactorEnabled: s.totpEnabled, createdAt: s.createdAt.toISOString() };
}

const idOf = (req: Request) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, "Staff member not found");
  return id;
};

export async function listStaff(_req: Request, res: Response) {
  const rows = await prisma.staffMember.findMany({ select, orderBy: { id: "asc" } });
  res.json({ staff: rows.map(serialize) });
}

export async function createStaff(req: Request, res: Response) {
  const d = req.body as z.infer<typeof createStaffSchema>;
  const created = await prisma.$transaction(async (tx) => {
    if (await tx.staffMember.findUnique({ where: { email: d.email } })) throw new HttpError(409, "A staff account with that email already exists");
    const row = await tx.staffMember.create({
      data: { name: d.name, email: d.email, role: d.role, access: d.access, photo: d.photo ?? null, passwordHash: await bcrypt.hash(d.password, 12) },
      select,
    });
    await record(tx, { entityType: "staff", entityId: row.id, action: "create", actor: staffActor(req.staff!), details: { name: row.name, email: row.email, role: row.role, access: row.access } });
    return row;
  });
  res.status(201).json({ staff: serialize(created) });
}

// Counts active administrators while locking their rows until the transaction ends, so two requests can't each see "there
// are two of us" and both remove the other one.
async function activeAdminCount(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM "StaffMember" WHERE role = 'ADMINISTRATOR' AND active = true FOR UPDATE`;
  return rows.length;
}

export async function updateStaff(req: Request, res: Response) {
  const id = idOf(req);
  const d = req.body as z.infer<typeof updateStaffSchema>;
  const isSelf = id === req.staff!.id;
  if (isSelf && (d.role !== undefined || d.active !== undefined || d.access !== undefined)) {
    throw new HttpError(409, "You can't change your own role, access or active status. Ask another administrator.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.staffMember.findUnique({ where: { id }, select });
    if (!existing) throw new HttpError(404, "Staff member not found");
    if (d.email && d.email !== existing.email && (await tx.staffMember.findUnique({ where: { email: d.email } }))) {
      throw new HttpError(409, "A staff account with that email already exists");
    }
    const losingAdmin = existing.role === "ADMINISTRATOR" && existing.active && (d.role === "STAFF" || d.active === false);
    if (losingAdmin && (await activeAdminCount(tx)) <= 1) throw new HttpError(409, "That's the last active administrator, so they can't be demoted or deactivated");

    const data: Prisma.StaffMemberUpdateInput = {};
    const changed: string[] = [];
    for (const key of ["name", "email", "role", "access", "photo", "active"] as const) {
      if (d[key] !== undefined && d[key] !== existing[key]) {
        (data as Record<string, unknown>)[key] = d[key];
        changed.push(key);
      }
    }
    if (d.password) {
      data.passwordHash = await bcrypt.hash(d.password, 12);
      changed.push("password");
    }
    if (d.resetTwoFactor) {
      Object.assign(data, { totpEnabled: false, totpSecret: null, totpLastStep: null, recoveryHashes: [] });
      changed.push("two-factor reset");
    }
    if (changed.length === 0) return { row: existing, signOut: false };

    const row = await tx.staffMember.update({ where: { id }, data, select });
    await record(tx, { entityType: "staff", entityId: id, action: "update", actor: staffActor(req.staff!), details: { changed } });
    // Anything that changes what they're allowed to do, or how they prove who they are, ends their current sessions.
    const signOut = changed.some((c) => ["role", "access", "active", "email", "password", "two-factor reset"].includes(c));
    return { row, signOut };
  });
  if (result.signOut) await revokeStaffSessions(id);
  res.json({ staff: serialize(result.row) });
}

export async function deleteStaff(req: Request, res: Response) {
  const id = idOf(req);
  if (id === req.staff!.id) throw new HttpError(409, "You can't remove your own account");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.staffMember.findUnique({ where: { id }, select });
    if (!existing) throw new HttpError(404, "Staff member not found");
    if (existing.role === "ADMINISTRATOR" && existing.active && (await activeAdminCount(tx)) <= 1) {
      throw new HttpError(409, "That's the last active administrator and can't be removed");
    }
    await tx.staffMember.delete({ where: { id } });
    await record(tx, { entityType: "staff", entityId: id, action: "delete", actor: staffActor(req.staff!), details: { name: existing.name, email: existing.email, role: existing.role } });
  });
  res.json({ ok: true });
}
