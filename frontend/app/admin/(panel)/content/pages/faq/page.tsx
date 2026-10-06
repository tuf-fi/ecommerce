"use client";

import { useContent } from "@/library/content";
import FaqEditor from "@/components/admin/content/FaqEditor";

// Plain list-management page (no live preview/rail), so it keeps the normal admin chrome (sidebar + topbar)
// instead of the chrome-less editor layout the ContentEditorShell-based single-entity editors use.
export default function FaqPage() {
    const { faqs, addFaq, updateFaq, deleteFaq, moveFaq } = useContent();
    return <FaqEditor faqs={faqs} onAdd={addFaq} onUpdate={updateFaq} onDelete={deleteFaq} onMove={moveFaq} />;
}
