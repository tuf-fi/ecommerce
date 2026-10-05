import { api } from "./client";
import type { AdminNotification, AdminUser, StaffMember } from "../admin/types";

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

// ---- staff ------------------------------------------------------------------------------------------------------------------

type ApiStaff = {
    id: number;
    name: string;
    email: string;
    role: "ADMINISTRATOR" | "STAFF";
    access: string;
    photo: string | null;
    active: boolean;
    twoFactorEnabled: boolean;
};

const toStaffMember = (s: ApiStaff): StaffMember => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role === "ADMINISTRATOR" ? "Administrator" : "Staff",
    access: s.access,
    photo: s.photo ?? undefined,
    active: s.active,
    twoFactorEnabled: s.twoFactorEnabled,
});

const apiRole = (role: StaffMember["role"]) => (role === "Administrator" ? "ADMINISTRATOR" : "STAFF");

export type StaffInput = Omit<StaffMember, "id" | "active" | "twoFactorEnabled"> & { password: string };
export type StaffPatch = Partial<Omit<StaffMember, "id" | "twoFactorEnabled">> & { password?: string; resetTwoFactor?: true };

export async function listStaff(): Promise<StaffMember[]> {
    const { staff } = await api<{ staff: ApiStaff[] }>("/staff");
    return staff.map(toStaffMember);
}

export const createStaff = (input: StaffInput) =>
    api<{ staff: ApiStaff }>("/staff", send("POST", { ...input, role: apiRole(input.role), photo: input.photo ?? null }));

export const updateStaff = (id: number, patch: StaffPatch) =>
    api<{ staff: ApiStaff }>(`/staff/${id}`, send("PATCH", { ...patch, ...(patch.role ? { role: apiRole(patch.role) } : {}), ...("photo" in patch ? { photo: patch.photo ?? null } : {}) }));

export const deleteStaff = (id: number) => api<{ ok: true }>(`/staff/${id}`, send("DELETE"));

// ---- customers (the admin "Users" list) ----------------------------------------------------------------------------------------

type ApiCustomer = { id: number; name: string; email: string; createdAt: string; orders: number };

// Walks every page, up to 20 (2,000 customers); the list is read-only.
export async function listCustomers(): Promise<AdminUser[]> {
    const all: AdminUser[] = [];
    for (let page = 1; page <= 20; page++) {
        const res = await api<{ total: number; customers: ApiCustomer[] }>(`/customers?page=${page}&pageSize=100`);
        all.push(...res.customers.map((c) => ({ id: c.id, name: c.name, email: c.email, createdAt: c.createdAt.slice(0, 10) })));
        if (res.customers.length === 0 || all.length >= res.total) break;
    }
    return all;
}

// ---- notifications --------------------------------------------------------------------------------------------------------------

type ApiNotification = { id: string; type: "order" | "inventory"; text: string; createdAt: string; read: boolean; ref?: string };

function ago(iso: string): string {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 2) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return days < 8 ? `${days} day${days === 1 ? "" : "s"} ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function listNotifications(): Promise<AdminNotification[]> {
    const { notifications } = await api<{ notifications: ApiNotification[] }>("/notifications");
    return notifications.map((n) => ({ id: n.id, type: n.type, text: n.text, time: ago(n.createdAt), read: n.read, ref: n.ref }));
}

export const markNotificationsRead = (input: { keys: string[] } | { all: true }) => api<{ ok: true }>("/notifications/read", send("POST", input));
