import { api } from "./client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Section key -> saved JSON. Only sections an admin has saved are present; the app keeps its built-in defaults for the rest.
export type SavedSections = Record<string, unknown>;

// Runs on the server (root layout). Not cached, so an admin who saves and reloads never sees a stale copy of their edit.
// Fails soft to "nothing saved" so a down API leaves the site rendering its defaults.
export type ContentSnapshot = { sections: SavedSections; versions: Record<string, string> };

export async function fetchContent(): Promise<ContentSnapshot> {
    try {
        const res = await fetch(`${API_URL}/content`, { cache: "no-store" });
        if (!res.ok) return { sections: {}, versions: {} };
        const { sections, versions } = (await res.json()) as { sections: SavedSections; versions?: Record<string, string> };
        return { sections, versions: versions ?? {} };
    } catch {
        return { sections: {}, versions: {} };
    }
}

export const saveContentSection = (section: string, data: unknown, expectedUpdatedAt: string | null) =>
    api<{ section: string; updatedAt: string }>(`/content/${encodeURIComponent(section)}`, { method: "PATCH", body: JSON.stringify({ data, expectedUpdatedAt }) });
