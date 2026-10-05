import { api } from "./client";

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const subscribeToNewsletter = (email: string) => api<{ ok: true }>("/newsletter/subscribe", post({ email }));

export type MyVoucher = { code: string; description: string; percentOff: number | null; expiresAt: string | null };

export const listMyVouchers = async () => (await api<{ vouchers: MyVoucher[] }>("/vouchers/mine")).vouchers;

export const requestWelcomeCode = (email: string) => api<{ ok: true }>("/promo/subscribe", post({ email }));

export const sendContactMessage = (input: { name: string; email: string; message: string }) => api<{ ok: true }>("/contact", post(input));
