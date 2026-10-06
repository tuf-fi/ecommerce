import { api } from "./client";
import type { Address } from "../store";

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

// A signed-in customer's saved delivery addresses and wishlist live on the server, so they follow the person to any device.
export const listAddresses = async () => (await api<{ addresses: Address[] }>("/addresses")).addresses;
export const createAddress = (input: { label: string; text: string; makeDefault?: boolean }) => api<{ address: Address }>("/addresses", send("POST", input));
export const updateAddress = (id: number, patch: { label?: string; text?: string; isDefault?: true }) => api<{ address: Address }>(`/addresses/${id}`, send("PATCH", patch));
export const deleteAddress = (id: number) => api<{ ok: true }>(`/addresses/${id}`, send("DELETE"));

export const getWishlist = async () => (await api<{ productIds: number[] }>("/wishlist")).productIds;
export const addToWishlist = (productId: number) => api<{ ok: true }>(`/wishlist/${productId}`, send("PUT"));
export const removeFromWishlist = (productId: number) => api<{ ok: true }>(`/wishlist/${productId}`, send("DELETE"));
// Sends what the browser saved before sign-in; the answer is the combined list.
export const mergeWishlist = async (productIds: number[]) => (await api<{ productIds: number[] }>("/wishlist/merge", send("POST", { productIds }))).productIds;

export const customerLogoutAll = () => api<{ ok: true }>("/auth/customer/logout-all", send("POST"));
export const customerGoogleSignIn = (idToken: string) =>
    api<{ customer: { id: number; name: string; email: string; avatarUrl?: string | null } }>("/auth/customer/google", send("POST", { idToken }));

export type CustomerNotification = { id: number; type: "order" | "account" | "voucher"; title: string; body: string; href: string | null; read: boolean; createdAt: string };
export const listMyNotifications = (opts?: { page: number; pageSize: number }) =>
    api<{ notifications: CustomerNotification[]; unread: number; total: number; page: number; pageSize: number }>(
        `/my/notifications${opts ? `?page=${opts.page}&pageSize=${opts.pageSize}` : ""}`
    );
export const sendTestNotification = () => api<{ ok: true }>("/my/notifications/test", send("POST", {}));
export const markMyNotificationsRead = (ids?: number[]) => api<{ ok: true }>("/my/notifications/read", send("POST", { ids }));
