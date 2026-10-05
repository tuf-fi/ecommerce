import { api } from "./client";

export type SessionCustomer = { id: number; name: string; email: string; avatarUrl?: string | null };
export type SessionStaff = { id: number; name: string; email: string; role: "ADMINISTRATOR" | "STAFF"; access?: string; twoFactorEnabled?: boolean };

// With 2FA on, the password step returns a challenge to exchange for a session once a code is entered.
export type AdminLoginResult = { staff: SessionStaff } | { twoFactorRequired: true; challenge: string };

export type AdminSessionInfo = { id: string; userAgent: string | null; ip: string | null; createdAt: string; lastSeenAt: string; current: boolean };

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const customerRegister = (input: { name: string; email: string; password: string }) =>
    api<{ customer: SessionCustomer }>("/auth/customer/register", post(input));

export const customerLogin = (input: { email: string; password: string }) =>
    api<{ customer: SessionCustomer }>("/auth/customer/login", post(input));

export const customerSession = () => api<{ customer: SessionCustomer }>("/auth/customer/session");

export const updateCustomerProfile = (patch: { name?: string; avatarUrl?: string | null }) =>
    api<{ customer: SessionCustomer }>("/auth/customer/profile", { method: "PATCH", body: JSON.stringify(patch) });

export const changeCustomerPassword = (input: { currentPassword: string; newPassword: string }) =>
    api<{ ok: true }>("/auth/customer/password", post(input));

export const customerLogout = () => api<{ ok: true }>("/auth/customer/logout", { method: "POST" });

export const otpRequest = (email: string) => api<{ ok: true }>("/auth/customer/otp/request", post({ email }));

export const otpVerify = (input: { email: string; code: string; newPassword: string }) =>
    api<{ ok: true }>("/auth/customer/otp/verify", post(input));

export const adminLogin = (input: { email: string; password: string }) => api<AdminLoginResult>("/auth/admin/login", post(input));

export const adminLoginTwoFactor = (input: { challenge: string; code: string }) =>
    api<{ staff: SessionStaff }>("/auth/admin/login/2fa", post(input));

export const listAdminSessions = () => api<{ sessions: AdminSessionInfo[] }>("/auth/admin/sessions");
export const revokeAdminSession = (id: string) => api<{ ok: true }>(`/auth/admin/sessions/${id}`, { method: "DELETE" });
export const revokeOtherAdminSessions = () => api<{ revoked: number }>("/auth/admin/sessions/revoke-others", post({}));

export const changeAdminPassword = (input: { currentPassword: string; newPassword: string }) =>
    api<{ ok: true; signedOutElsewhere: number }>("/auth/admin/password", post(input));

export const startTwoFactorSetup = () => api<{ secret: string; otpauthUrl: string; qrDataUrl: string }>("/auth/admin/2fa/setup", post({}));
export const enableTwoFactor = (code: string) => api<{ recoveryCodes: string[] }>("/auth/admin/2fa/enable", post({ code }));
export const disableTwoFactor = (input: { password: string; code: string }) => api<{ ok: true }>("/auth/admin/2fa/disable", post(input));

export const adminSession = () => api<{ staff: SessionStaff }>("/auth/admin/session");

export const adminLogout = () => api<{ ok: true }>("/auth/admin/logout", { method: "POST" });
