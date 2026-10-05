import type { Request } from "express";
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";

// In-memory counters: correct for one API process. Running several instances needs a shared store (e.g. Redis).
// Behind a reverse proxy, set TRUST_PROXY (see app.ts) or every client shares the proxy's address.
const base: Partial<Options> = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
};

const tooMany = (what: string) => ({ error: `Too many ${what}. Please wait a while and try again.` });

const ip = (req: Request) => ipKeyGenerator(req.ip ?? "");
const emailOf = (req: Request) => String(req.body?.email ?? "").trim().toLowerCase();

// Backstop for the whole API, per client address.
export const apiLimiter = rateLimit({ ...base, windowMs: 60_000, limit: 300, message: tooMany("requests") });

// Failed sign-ins only (successes aren't counted). Two layers: per address+account stops guessing one account's password;
// per address alone stops one machine trying many accounts.
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ip(req)}|${emailOf(req)}`,
  message: tooMany("sign-in attempts"),
});
export const loginByIpLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 40,
  skipSuccessfulRequests: true,
  keyGenerator: ip,
  message: tooMany("sign-in attempts"),
});

// Staff accounts are higher value, so they get fewer tries.
export const adminLoginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ip(req)}|${emailOf(req)}`,
  message: tooMany("sign-in attempts"),
});

// Second-factor and recovery-code guesses.
export const twoFactorLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 8,
  skipSuccessfulRequests: true,
  keyGenerator: ip,
  message: tooMany("verification attempts"),
});

// Password change and 2FA enrol/disable for an already signed-in account. Keyed by account (use after requireStaff/requireCustomer),
// so these attempts don't share a counter with anonymous sign-in guesses.
export const accountSecurityLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => (req.staff ? `staff:${req.staff.id}` : req.customerId ? `customer:${req.customerId}` : ip(req)),
  message: tooMany("attempts"),
});

// Every request sends (or pretends to send) an email, so this is also spam protection.
export const otpRequestLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60_000,
  limit: 5,
  keyGenerator: (req) => `${ip(req)}|${emailOf(req)}`,
  message: tooMany("code requests"),
});
export const otpVerifyLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60_000,
  limit: 10,
  keyGenerator: (req) => `${ip(req)}|${emailOf(req)}`,
  message: tooMany("attempts"),
});

export const registerLimiter = rateLimit({ ...base, windowMs: 60 * 60_000, limit: 10, keyGenerator: ip, message: tooMany("sign-ups") });

// Public forms that write rows and send email.
export const formsLimiter = rateLimit({ ...base, windowMs: 60 * 60_000, limit: 10, keyGenerator: ip, message: tooMany("submissions") });

// Creating orders / payment sessions / reviews / upload signatures: generous for real use, tight against scripts.
export const checkoutLimiter = rateLimit({ ...base, windowMs: 60 * 60_000, limit: 30, keyGenerator: ip, message: tooMany("checkout requests") });
export const uploadSignLimiter = rateLimit({ ...base, windowMs: 60 * 60_000, limit: 60, keyGenerator: ip, message: tooMany("upload requests") });
