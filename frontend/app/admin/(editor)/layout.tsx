"use client";

import AdminAuthGate from "@/components/admin/AdminAuthGate";
import { FULL_BLEED } from "@/components/admin/formClasses";

// Chrome-less counterpart to (panel)/layout.tsx — same auth gate, no AdminSidebar/AdminTopbar, no padding, so
// single-entity content editors (ContentEditorShell) get the full viewport, edge to edge, for their live preview
// + meta rail. Locked to exactly one screen at `lg`+ (where the rail floats fixed) — the preview and rail each
// scroll internally instead of the whole page growing past the viewport.
export default function AdminEditorLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminAuthGate>
            <div className={`${FULL_BLEED} min-h-screen bg-white lg:h-screen lg:overflow-hidden`}>{children}</div>
        </AdminAuthGate>
    );
}
