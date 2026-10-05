// Which admin areas an account may use. Administrators can use everything; a STAFF account is limited by its `access` level,
// which the Staff page offers as a fixed list. Anything unrecognised gets no sections (fail closed), unlike the old
// display-only rule, which showed everything for unknown values.
export type Section = "inventory" | "orders" | "content" | "customers";

export const ACCESS_LEVELS = ["Full access", "Inventory & orders only", "Inventory only", "Orders only", "Custom"] as const;

const ALLOWED: Record<string, Section[]> = {
  "Full access": ["inventory", "orders", "content", "customers"],
  "Inventory & orders only": ["inventory", "orders"],
  "Inventory only": ["inventory"],
  "Orders only": ["orders"],
  // "Custom" has no definition yet, so it grants nothing beyond the dashboard and the person's own security settings.
  Custom: [],
};

export function canAccess(staff: { role: string; access: string }, section: Section): boolean {
  if (staff.role === "ADMINISTRATOR") return true;
  return (ALLOWED[staff.access] ?? []).includes(section);
}
