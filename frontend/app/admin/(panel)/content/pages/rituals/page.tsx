import RitualsTab from "@/components/admin/content/RitualsTab";

// Plain list-management page (no live preview/rail), so it keeps the normal admin chrome (sidebar + topbar)
// instead of the chrome-less editor layout the ContentEditorShell-based single-entity editors use.
export default function RitualsPage() {
    return <RitualsTab />;
}
