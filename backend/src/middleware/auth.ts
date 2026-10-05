import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { COOKIE_NAMES, readToken, verifyToken } from "../lib/jwt";

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  const id = verifyToken("customer", req.cookies?.[COOKIE_NAMES.customer]);
  if (id === null) return res.status(401).json({ error: "Not signed in" });
  req.customerId = id;
  next();
}

const TOUCH_AFTER_MS = 60_000;

// A valid signature isn't enough: the AdminSession row must still exist, belong to this staff member, not be revoked and
// not be expired. The staff row is re-read every request so a role change or deletion applies immediately.
async function loadStaff(req: Request) {
  const token = readToken("staff", req.cookies?.[COOKIE_NAMES.staff]);
  if (!token?.sessionId) return null;

  const session = await prisma.adminSession.findUnique({
    where: { id: token.sessionId },
    include: { staff: { select: { id: true, email: true, name: true, role: true, access: true, active: true, totpEnabled: true } } },
  });
  if (!session || session.staffId !== token.id || session.revokedAt || session.expiresAt < new Date() || !session.staff.active) return null;

  // "Last active" is informational, so it is only refreshed about once a minute.
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_AFTER_MS) {
    void prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  const { totpEnabled, active: _active, ...staff } = session.staff;
  return { staff: { ...staff, twoFactorEnabled: totpEnabled }, sessionId: session.id };
}

export async function requireStaff(req: Request, res: Response, next: NextFunction) {
  const found = await loadStaff(req);
  if (!found) return res.status(401).json({ error: "Not signed in" });
  req.staff = found.staff;
  req.sessionId = found.sessionId;
  next();
}

// For resources both an owner (customer) and staff may read; the handler decides what each is allowed to see.
export async function requireStaffOrCustomer(req: Request, res: Response, next: NextFunction) {
  const found = await loadStaff(req);
  if (found) {
    req.staff = found.staff;
    req.sessionId = found.sessionId;
    return next();
  }
  const id = verifyToken("customer", req.cookies?.[COOKIE_NAMES.customer]);
  if (id === null) return res.status(401).json({ error: "Not signed in" });
  req.customerId = id;
  next();
}
