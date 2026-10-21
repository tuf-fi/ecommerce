import jwt from "jsonwebtoken";
import type { CookieOptions, Response } from "express";

export type TokenKind = "customer" | "staff";

export const COOKIE_NAMES = { customer: "customer_token", staff: "admin_token" } as const;

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// "Remember me" keeps a customer signed in for 30 days; leaving it off gives a browser-session cookie backed by a 24h token.
export const REMEMBER_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SHORT_SESSION_MS = 24 * 60 * 60 * 1000;
const CHALLENGE_TTL_SECONDS = 5 * 60;

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s === "change-me") throw new Error("JWT_SECRET is not set");
  return s;
}

// Staff tokens carry the id of their AdminSession row as `jti`, which is what lets a session be revoked server-side.
// Customer tokens also carry the customer's tokenVersion (`ver`); raising it on the server signs every device out.
export function signToken(kind: TokenKind, id: number, sessionId?: string, version?: number, ttlMs: number = SESSION_MAX_AGE_MS): string {
  return jwt.sign(version === undefined ? { kind } : { kind, ver: version }, secret(), {
    subject: String(id),
    expiresIn: ttlMs / 1000,
    ...(sessionId ? { jwtid: sessionId } : {}),
  });
}

// Returns the subject (and session id, if any), or null for any invalid/expired/wrong-kind token.
export function readToken(kind: TokenKind, token: string | undefined): { id: number; sessionId?: string; version: number } | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret()) as jwt.JwtPayload;
    if (payload.kind !== kind || !payload.sub) return null;
    return { id: Number(payload.sub), sessionId: payload.jti, version: typeof payload.ver === "number" ? payload.ver : 0 };
  } catch {
    return null;
  }
}

export const verifyToken = (kind: TokenKind, token: string | undefined): number | null => readToken(kind, token)?.id ?? null;

// Short-lived proof that the password step passed, exchanged for a real session once the second factor is verified.
export function signTwoFactorChallenge(staffId: number): string {
  return jwt.sign({ kind: "staff-2fa" }, secret(), { subject: String(staffId), expiresIn: CHALLENGE_TTL_SECONDS });
}

export function verifyTwoFactorChallenge(token: string): number | null {
  try {
    const payload = jwt.verify(token, secret()) as jwt.JwtPayload;
    return payload.kind === "staff-2fa" && payload.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  domain: process.env.COOKIE_DOMAIN || undefined,
};

// `remember`: true = 30-day persistent cookie, false = session cookie (gone when the browser closes), undefined = the 7-day default.
export function setAuthCookie(res: Response, kind: TokenKind, id: number, sessionId?: string, version?: number, remember?: boolean) {
  if (remember === false) {
    res.cookie(COOKIE_NAMES[kind], signToken(kind, id, sessionId, version, SHORT_SESSION_MS), cookieOptions);
    return;
  }
  const maxAge = remember ? REMEMBER_MAX_AGE_MS : SESSION_MAX_AGE_MS;
  res.cookie(COOKIE_NAMES[kind], signToken(kind, id, sessionId, version, maxAge), { ...cookieOptions, maxAge });
}

// Reads the "remember me" choice back out of an existing token's lifetime, so re-issuing a cookie keeps it.
export function rememberOfToken(token: string | undefined): boolean | undefined {
  const p = token ? (jwt.decode(token) as jwt.JwtPayload | null) : null;
  if (!p?.exp || !p.iat) return undefined;
  const ms = (p.exp - p.iat) * 1000;
  if (ms >= REMEMBER_MAX_AGE_MS) return true;
  if (ms <= SHORT_SESSION_MS) return false;
  return undefined;
}

export function clearAuthCookie(res: Response, kind: TokenKind) {
  res.clearCookie(COOKIE_NAMES[kind], cookieOptions);
}
