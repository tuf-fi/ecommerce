import { notifyPasswordChanged,notifyProfileUpdated } from "../services/customerNotifications.service";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { clearAuthCookie, COOKIE_NAMES, readToken, setAuthCookie, signTwoFactorChallenge } from "../lib/jwt";
import { startAdminSession } from "../services/adminSession.service";
import { GoogleProfile, verifyGoogleIdToken } from "../services/google.service";

const BCRYPT_ROUNDS = 12;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const email = z.string().trim().toLowerCase().email();
const password = z.string().min(8).max(200);

const registerSchema = z.object({ name: z.string().trim().min(1).max(100), email, password });
const loginSchema = z.object({ email, password: z.string().min(1).max(200) });
const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    // Only images hosted on our Cloudinary account (or cleared with null) can be used as an avatar.
    avatarUrl: z.string().url().max(500).nullable().optional(),
  })
  .refine((v) => v.name !== undefined || v.avatarUrl !== undefined, "Nothing to update");
const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: password });
const otpRequestSchema = z.object({ email });
const otpVerifySchema = z.object({ email, code: z.string().regex(/^\d{6}$/), newPassword: password });

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function passwordMatches(plain: string, hash: string | undefined) {
  const ok = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return ok && hash !== undefined;
}

function invalid(res: Response, err: z.ZodError) {
  return res.status(400).json({ error: err.issues[0]?.message ?? "Invalid request" });
}

export async function customerRegister(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const { name, email, password } = parsed.data;

  if (await prisma.customer.findUnique({ where: { email } })) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }
  const customer = await prisma.customer.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) },
  });
  setAuthCookie(res, "customer", customer.id, undefined, customer.tokenVersion);
  res.status(201).json({ customer: { id: customer.id, name: customer.name, email: customer.email } });
}

export async function customerLogin(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const { email, password } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!(await passwordMatches(password, customer?.passwordHash)) || !customer) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  setAuthCookie(res, "customer", customer.id, undefined, customer.tokenVersion);
  res.json({ customer: { id: customer.id, name: customer.name, email: customer.email } });
}

export async function customerSession(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.customerId },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  if (!customer) return res.status(401).json({ error: "Not signed in" });
  res.json({ customer });
}

export async function customerChangePassword(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const { currentPassword, newPassword } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { id: req.customerId } });
  if (!customer) return res.status(401).json({ error: "Not signed in" });
  if (!(await bcrypt.compare(currentPassword, customer.passwordHash))) return res.status(400).json({ error: "Your current password is incorrect" });
  if (currentPassword === newPassword) return res.status(400).json({ error: "Choose a password you haven't used here" });

  // Other devices are signed out (someone may have known the old password); this one is re-issued so the person stays in.
  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS), tokenVersion: { increment: 1 } },
  });
  setAuthCookie(res, "customer", updated.id, undefined, updated.tokenVersion);
  void notifyPasswordChanged(updated.id);
  res.json({ ok: true });
}

export async function customerLogoutAll(req: Request, res: Response) {
  await prisma.customer.update({ where: { id: req.customerId }, data: { tokenVersion: { increment: 1 } } });
  clearAuthCookie(res, "customer");
  res.json({ ok: true });
}

const googleSchema = z.object({ idToken: z.string().min(20).max(4000) });

// "Sign in with Google": the browser sends the ID token Google gave it. If an account with that (Google-verified) email
// exists, that person is signed in; otherwise an account is created with an unusable random password.
export async function customerGoogle(req: Request, res: Response) {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const profile = await verifyGoogleIdToken(parsed.data.idToken);
  const customer = await findOrCreateGoogleCustomer(profile);
  setAuthCookie(res, "customer", customer.id, undefined, customer.tokenVersion);
  res.json({ customer: { id: customer.id, name: customer.name, email: customer.email, avatarUrl: customer.avatarUrl } });
}

export async function findOrCreateGoogleCustomer(profile: GoogleProfile) {
  const existing = await prisma.customer.findUnique({ where: { email: profile.email } });
  if (existing) return existing;
  return prisma.customer.create({
    data: { email: profile.email, name: profile.name, passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), BCRYPT_ROUNDS) },
  });
}

export async function customerUpdateProfile(req: Request, res: Response) {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const { name, avatarUrl } = parsed.data;
  if (avatarUrl) {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloud || !avatarUrl.startsWith(`https://res.cloudinary.com/${cloud}/`)) {
      return res.status(400).json({ error: "That image isn't allowed" });
    }
  }
  const customer = await prisma.customer.update({
    where: { id: req.customerId },
    data: { ...(name !== undefined ? { name } : {}), ...(avatarUrl !== undefined ? { avatarUrl } : {}) },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  if (name !== undefined || avatarUrl !== undefined) void notifyProfileUpdated(customer.id, name !== undefined && avatarUrl !== undefined ? "name and photo" : name !== undefined ? "name" : "photo");
  res.json({ customer });
}

export function customerLogout(_req: Request, res: Response) {
  clearAuthCookie(res, "customer");
  res.json({ ok: true });
}

export async function otpRequest(req: Request, res: Response) {
  const parsed = otpRequestSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const { email } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (customer) {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    await prisma.otpCode.deleteMany({ where: { email } });
    await prisma.otpCode.create({
      data: { email, codeHash: sha256(code), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    });
    // TODO(Phase 7): send via email.service instead of logging.
    if (process.env.NODE_ENV !== "production") console.log(`[otp] ${email}: ${code}`);
  }
  // Same response whether or not the account exists.
  res.json({ ok: true });
}

export async function otpVerify(req: Request, res: Response) {
  const parsed = otpVerifySchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const { email, code, newPassword } = parsed.data;

  const otp = await prisma.otpCode.findFirst({ where: { email, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.expiresAt < new Date() || otp.attempts >= OTP_MAX_ATTEMPTS) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }
  if (sha256(code) !== otp.codeHash) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) return res.status(400).json({ error: "Invalid or expired code" });

  await prisma.$transaction([
    prisma.customer.update({ where: { id: customer.id }, data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS), tokenVersion: { increment: 1 } } }),
    prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
  ]);
  void notifyPasswordChanged(customer.id);
  res.json({ ok: true });
}

export async function adminLogin(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const { email, password } = parsed.data;

  const staff = await prisma.staffMember.findUnique({ where: { email } });
  // A deactivated account is answered exactly like a wrong password.
  if (!(await passwordMatches(password, staff?.passwordHash)) || !staff || !staff.active) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  // With 2FA on, the password alone gets no session: only a short-lived challenge to exchange for one with a valid code.
  if (staff.totpEnabled) return res.json({ twoFactorRequired: true, challenge: signTwoFactorChallenge(staff.id) });

  await startAdminSession(req, res, staff.id);
  res.json({ staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role, access: staff.access, twoFactorEnabled: false } });
}

export function adminSession(req: Request, res: Response) {
  res.json({ staff: req.staff });
}

export async function adminLogout(req: Request, res: Response) {
  // Revoke the server-side session too, so a copied cookie stops working the moment its owner logs out.
  const token = readToken("staff", req.cookies?.[COOKIE_NAMES.staff]);
  if (token?.sessionId) {
    await prisma.adminSession.updateMany({ where: { id: token.sessionId, staffId: token.id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  clearAuthCookie(res, "staff");
  res.json({ ok: true });
}
