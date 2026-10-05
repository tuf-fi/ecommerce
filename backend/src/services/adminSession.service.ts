import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { SESSION_MAX_AGE_MS, setAuthCookie } from "../lib/jwt";

// Creates the server-side session row and sets the cookie whose JWT points at it.
export async function startAdminSession(req: Request, res: Response, staffId: number) {
  const id = randomUUID();
  await prisma.adminSession.create({
    data: {
      id,
      staffId,
      userAgent: req.get("user-agent")?.slice(0, 300) ?? null,
      ip: req.ip ?? null,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
    },
  });
  setAuthCookie(res, "staff", staffId, id);
}

// Revokes every active session of a staff member except (optionally) one.
export async function revokeStaffSessions(staffId: number, exceptSessionId?: string): Promise<number> {
  const result = await prisma.adminSession.updateMany({
    where: { staffId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

// Rows that can no longer matter are deleted so the table doesn't grow forever.
export async function purgeOldSessions(): Promise<number> {
  const week = 7 * 24 * 60 * 60 * 1000;
  const result = await prisma.adminSession.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date(Date.now() - week) } }, { revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }] },
  });
  return result.count;
}
