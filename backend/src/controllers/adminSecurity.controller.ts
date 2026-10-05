import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import { generateSecret, generateURI, verify } from "otplib";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/httpError";
import { clearAuthCookie, verifyTwoFactorChallenge } from "../lib/jwt";
import { decryptSecret, encryptSecret, sha256 } from "../lib/crypto";
import { record, staffActor } from "../services/audit.service";
import { revokeStaffSessions, startAdminSession } from "../services/adminSession.service";

const code6 = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");
const password = z.string().min(1).max(200);

export const changePasswordSchema = z.object({ currentPassword: password, newPassword: z.string().min(8).max(200) });
export const enableTwoFactorSchema = z.object({ code: code6 });
export const disableTwoFactorSchema = z.object({ password, code: code6 });
export const twoFactorLoginSchema = z.object({
  challenge: z.string().min(10).max(2000),
  // A 6-digit authenticator code, or a one-time recovery code like "abcde-fghij".
  code: z.string().trim().min(6).max(20),
});

// ---- sessions ------------------------------------------------------------------------------------------------------

export async function listSessions(req: Request, res: Response) {
  const rows = await prisma.adminSession.findMany({
    where: { staffId: req.staff!.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
  });
  res.json({
    sessions: rows.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ip: s.ip,
      createdAt: s.createdAt.toISOString(),
      lastSeenAt: s.lastSeenAt.toISOString(),
      current: s.id === req.sessionId,
    })),
  });
}

export async function revokeSession(req: Request, res: Response) {
  const id = String(req.params.id);
  // Scoped to the caller's own sessions, so one staff member can't end another's.
  const result = await prisma.adminSession.updateMany({ where: { id, staffId: req.staff!.id, revokedAt: null }, data: { revokedAt: new Date() } });
  if (result.count === 0) throw new HttpError(404, "Session not found");
  if (id === req.sessionId) clearAuthCookie(res, "staff");
  res.json({ ok: true });
}

export async function revokeOtherSessions(req: Request, res: Response) {
  res.json({ revoked: await revokeStaffSessions(req.staff!.id, req.sessionId) });
}

// ---- password ------------------------------------------------------------------------------------------------------

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
  const staff = await prisma.staffMember.findUniqueOrThrow({ where: { id: req.staff!.id } });
  if (!(await bcrypt.compare(currentPassword, staff.passwordHash))) throw new HttpError(400, "Your current password is incorrect");
  if (currentPassword === newPassword) throw new HttpError(400, "Choose a password you haven't used here");

  await prisma.$transaction(async (tx) => {
    await tx.staffMember.update({ where: { id: staff.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
    await record(tx, { entityType: "staff", entityId: staff.id, action: "password-change", actor: staffActor(req.staff!) });
  });
  // A changed password signs the account out everywhere else (someone may have been using the old one).
  const revoked = await revokeStaffSessions(staff.id, req.sessionId);
  res.json({ ok: true, signedOutElsewhere: revoked });
}

// ---- two-factor ----------------------------------------------------------------------------------------------------

const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const normalizeRecovery = (c: string) => c.toLowerCase().replace(/[^a-z0-9]/g, "");

function newRecoveryCode() {
  const bytes = randomBytes(10);
  const chars = Array.from(bytes, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

// Step 1: mint a secret and show it as a QR code. Nothing is enforced until the first code is confirmed in step 2.
export async function twoFactorSetup(req: Request, res: Response) {
  const staff = await prisma.staffMember.findUniqueOrThrow({ where: { id: req.staff!.id }, select: { totpEnabled: true, email: true } });
  if (staff.totpEnabled) throw new HttpError(409, "Two-factor authentication is already on");

  const secret = generateSecret();
  await prisma.staffMember.update({ where: { id: req.staff!.id }, data: { totpSecret: encryptSecret(secret), totpLastStep: null } });
  const otpauthUrl = generateURI({ issuer: "Cindyrella Admin", label: staff.email, secret });
  res.json({ secret, otpauthUrl, qrDataUrl: await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 }) });
}

// Checks a code against a staff member's TOTP secret and burns its time step so the same code can't be used twice.
async function consumeTotp(staffId: number, encryptedSecret: string, lastStep: number | null, token: string): Promise<boolean> {
  const result = await verify({ secret: decryptSecret(encryptedSecret), token, epochTolerance: 30, afterTimeStep: lastStep ?? undefined });
  // The TOTP result carries `timeStep`; the type is a union with HOTP's, which doesn't.
  if (!result.valid || !("timeStep" in result)) return false;
  const step = result.timeStep;
  const claimed = await prisma.staffMember.updateMany({
    where: { id: staffId, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
    data: { totpLastStep: step },
  });
  return claimed.count === 1;
}

// Step 2: prove the authenticator is set up by entering a code. Returns one-time recovery codes — shown only here, once.
export async function twoFactorEnable(req: Request, res: Response) {
  const { code } = req.body as z.infer<typeof enableTwoFactorSchema>;
  const staff = await prisma.staffMember.findUniqueOrThrow({ where: { id: req.staff!.id } });
  if (staff.totpEnabled) throw new HttpError(409, "Two-factor authentication is already on");
  if (!staff.totpSecret) throw new HttpError(400, "Start setup first");
  if (!(await consumeTotp(staff.id, staff.totpSecret, staff.totpLastStep, code))) throw new HttpError(400, "That code isn't right. Check your authenticator and try again.");

  const recoveryCodes = Array.from({ length: 8 }, newRecoveryCode);
  await prisma.$transaction(async (tx) => {
    await tx.staffMember.update({ where: { id: staff.id }, data: { totpEnabled: true, recoveryHashes: recoveryCodes.map((c) => sha256(normalizeRecovery(c))) } });
    await record(tx, { entityType: "staff", entityId: staff.id, action: "2fa-enable", actor: staffActor(req.staff!) });
  });
  res.json({ recoveryCodes });
}

export async function twoFactorDisable(req: Request, res: Response) {
  const { password: pw, code } = req.body as z.infer<typeof disableTwoFactorSchema>;
  const staff = await prisma.staffMember.findUniqueOrThrow({ where: { id: req.staff!.id } });
  if (!staff.totpEnabled || !staff.totpSecret) throw new HttpError(409, "Two-factor authentication isn't on");
  if (!(await bcrypt.compare(pw, staff.passwordHash))) throw new HttpError(400, "Your password is incorrect");
  if (!(await consumeTotp(staff.id, staff.totpSecret, staff.totpLastStep, code))) throw new HttpError(400, "That code isn't right");

  await prisma.$transaction(async (tx) => {
    await tx.staffMember.update({ where: { id: staff.id }, data: { totpEnabled: false, totpSecret: null, totpLastStep: null, recoveryHashes: [] } });
    await record(tx, { entityType: "staff", entityId: staff.id, action: "2fa-disable", actor: staffActor(req.staff!) });
  });
  res.json({ ok: true });
}

// Second step of sign-in, for accounts with 2FA on. The challenge from the password step proves who is asking.
export async function twoFactorLogin(req: Request, res: Response) {
  const { challenge, code } = req.body as z.infer<typeof twoFactorLoginSchema>;
  const staffId = verifyTwoFactorChallenge(challenge);
  const fail = () => res.status(401).json({ error: "That code isn't right, or sign-in expired. Start again." });
  if (staffId === null) return fail();

  const staff = await prisma.staffMember.findUnique({ where: { id: staffId } });
  if (!staff?.totpEnabled || !staff.totpSecret || !staff.active) return fail();

  let ok = false;
  if (/^\d{6}$/.test(code)) {
    ok = await consumeTotp(staff.id, staff.totpSecret, staff.totpLastStep, code);
  } else {
    const hash = sha256(normalizeRecovery(code));
    if (staff.recoveryHashes.includes(hash)) {
      // Conditional on the code still being present, so two simultaneous uses can't both succeed.
      const used = await prisma.staffMember.updateMany({
        where: { id: staff.id, recoveryHashes: { has: hash } },
        data: { recoveryHashes: staff.recoveryHashes.filter((h) => h !== hash) },
      });
      ok = used.count === 1;
    }
  }
  if (!ok) return fail();

  await startAdminSession(req, res, staff.id);
  res.json({ staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role, access: staff.access, twoFactorEnabled: true } });
}
