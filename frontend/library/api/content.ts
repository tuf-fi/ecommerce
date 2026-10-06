import { api } from "./client";

import { MOCK_API } from "../mock/config";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Section key -> saved JSON. Only sections an admin has saved are present; the app keeps its built-in defaults for the rest.
export type SavedSections = Record<string, unknown>;

// Runs on the server (root layout). Not cached, so an admin who saves and reloads never sees a stale copy of their edit.
// Fails soft to "nothing saved" so a down API leaves the site rendering its defaults.
export async function fetchContent(): Promise<SavedSections> {
    // Testimonials are switched off on the landing page (the same toggle as Admin > Content); the nav link follows it.
    if (MOCK_API) return { visibility: { testimonials: false } };
    try {
        const res = await fetch(`${API_URL}/content`, { cache: "no-store" });
        if (!res.ok) return {};
        const { sections } = (await res.json()) as { sections: SavedSections };
        return sections;
    } catch {
        return {};
    }
}

export const saveContentSection = (section: string, data: unknown) =>
    api<{ section: string; updatedAt: string }>(`/content/${encodeURIComponent(section)}`, { method: "PATCH", body: JSON.stringify({ data }) });
