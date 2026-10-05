import { StaffMember } from "./types";


// "payments" (Settings → Payment Details) is administrators only, like "staff".
export type AdminSection = "dashboard" | "inventory" | "orders" | "staff" | "content" | "settings" | "payments";

// Mirrors backend/src/lib/sections.ts — the server is what actually enforces this; this only hides menu items so people
// aren't shown pages they'd be refused. Unrecognised access values get nothing (fail closed), same as the server.
const ACCESS_SECTION_MAP: Record<string, AdminSection[]> = {
    "Full access": ["inventory", "orders", "content"],
    "Inventory & orders only": ["inventory", "orders"],
    "Inventory only": ["inventory"],
    "Orders only": ["orders"],
    Custom: [],
};

export function isAdministrator(staffMember: StaffMember | null): boolean {
    return staffMember?.role === "Administrator";
}

// The dashboard and the person's own settings are open to every signed-in account; "staff" is administrators only.
export function canAccessSection(staffMember: StaffMember | null, section: AdminSection): boolean {
    if (section === "dashboard" || section === "settings") return true;
    if (!staffMember) return false;
    if (isAdministrator(staffMember)) return true;
    if (section === "staff" || section === "payments") return false;
    return (ACCESS_SECTION_MAP[staffMember.access] ?? []).includes(section);
}

// Gated on role alone, not the free-text access map, so no Staff account can reach the page that promotes to Administrator.
export function canManageStaff(staffMember: StaffMember | null): boolean {
    return isAdministrator(staffMember);
}

// Which section a page address belongs to, so a person who types (or bookmarks) a page they can't use is sent away.
// Pages not listed (dashboard, own settings) are open to every signed-in account.
export function sectionForPath(pathname: string): AdminSection | null {
    if (pathname.startsWith("/admin/inventory")) return "inventory";
    if (pathname.startsWith("/admin/orders")) return "orders";
    if (pathname.startsWith("/admin/content")) return "content";
    if (pathname.startsWith("/admin/staff")) return "staff";
    if (pathname.startsWith("/admin/settings/payments")) return "payments";
    return null;
}
