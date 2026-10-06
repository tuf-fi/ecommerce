import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { COOKIE_NAMES, readToken } from "../lib/jwt";

// A valid signature isn't enough: the token's version must still match the customer's current tokenVersion, so "sign out of all
// devices", a password change or a reset really ends every older login. Tokens issued before versions existed count as 0.
export async function resolveCustomerId(req: Request): Promise<number | null> {
  const token = readToken("customer", req.cookies?.[COOKIE_NAMES.customer]);
  if (!token) return null;
  const customer = await prisma.customer.findUnique({ where: { id: token.id }, select: { tokenVersion: true } });
  return customer && customer.tokenVersion === token.version ? token.id : null;
}

export async function requireCustomer(req: Request, res: Response, next: NextFunction) {
  const id = await resolveCustomerId(req);
  if (id === null) return res.status(401).json({ error: "Not signed in" });
  req.customerId = id;
  next();
}

// Like requireCustomer but never rejects: sets req.customerId when a valid customer cookie is present, so a page that
// works for visitors can still tailor its answer for someone signed in (e.g. checking a voucher code).
export async function softCustomer(req: Request, _res: Response, next: NextFunction) {
  const id = await resolveCustomerId(req);
  if (id !== null) req.customerId = id;
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
  const id = await resolveCustomerId(req);
  if (id === null) return res.status(401).json({ error: "Not signed in" });
  req.customerId = id;
  next();
}
