import TestimonialsTab from "@/components/admin/content/TestimonialsTab";

// Plain list-management page (no live preview/rail), so it keeps the normal admin chrome (sidebar + topbar)
// instead of the chrome-less editor layout the ContentEditorShell-based single-entity editors use.
export default function TestimonialsPage() {
    return <TestimonialsTab />;
}
