"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { Faq, StaticPage } from "@/library/admin/types";
import LivePreviewPane from "@/components/admin/LivePreviewPane";
import HeroEditor from "@/components/admin/content/HeroEditor";
import PageIntroEditor from "@/components/admin/content/PageIntroEditor";
import { PageIntroKey } from "@/library/content";
import AboutPage from "@/components/pages/AboutPage";
import ShippingReturnsPage from "@/components/pages/ShippingReturnsPage";
import PrivacyPolicyPage from "@/components/pages/PrivacyPolicyPage";
import TermsPage from "@/components/pages/TermsPage";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import FaqModal from "@/components/admin/modals/FaqModal";
import { BTN_ADD, BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";

const PAGE_SIZE = 10;

function FaqEditor({
    faqs,
    onAdd,
    onUpdate,
    onDelete,
    onMove,
    onBack,
}: {
    faqs: Faq[];
    onAdd: (data: Omit<Faq, "id">) => void;
    onUpdate: (id: number, patch: Partial<Omit<Faq, "id">>) => void;
    onDelete: (id: number) => void;
    onMove: (id: number, direction: "up" | "down") => void;
    onBack: () => void;
}) {
    const [editing, setEditing] = useState<Faq | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleting = faqs.find((f) => f.id === deleteId) ?? null;

    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(faqs.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = faqs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    function handleSave(data: Omit<Faq, "id">, id?: number) {
        if (id) onUpdate(id, data);
        else onAdd(data);
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <button onClick={onBack} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Pages
                </button>
                <button
                    onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                    }}
                    className={BTN_ADD}
                >
                    + Add FAQ
                </button>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-off/50">
                            {["ID", "Question", "Answer", ""].map((h) => (
                                <th key={h} className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {faqs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-16 text-center text-[13px] text-grey">
                                    No FAQs yet.
                                </td>
                            </tr>
                        )}
                        {paged.map((f) => {
                            const i = faqs.findIndex((x) => x.id === f.id);
                            return (
                            <tr key={f.id} className="transition hover:bg-off/40">
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="font-mono text-[12px] text-grey">{f.id}</span>
                                        <div className="flex flex-col gap-0.5 text-grey">
                                            <button
                                                disabled={i === 0}
                                                onClick={() => onMove(f.id, "up")}
                                                aria-label="Move up"
                                                className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M18 15l-6-6-6 6" />
                                                </svg>
                                            </button>
                                            <button
                                                disabled={i === faqs.length - 1}
                                                onClick={() => onMove(f.id, "down")}
                                                aria-label="Move down"
                                                className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                <td className="max-w-[220px] border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{f.q}</td>
                                <td className="max-w-[320px] border-b border-ink/10 px-5 py-3 text-[13px] text-grey">
                                    <span className="line-clamp-2">{f.a}</span>
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <Tooltip label="Edit">
                                            <button
                                                onClick={() => {
                                                    setEditing(f);
                                                    setModalOpen(true);
                                                }}
                                                aria-label="Edit FAQ"
                                                className={ICON_BTN}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(f.id)} aria-label="Remove FAQ" className={ICON_BTN_DANGER}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M4 7h16" />
                                                    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                                    <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
                                                    <path d="M10 11v6M14 11v6" />
                                                </svg>
                                            </button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            {modalOpen && <FaqModal item={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this FAQ?"
                description={deleting ? `"${deleting.q}" will be removed from the FAQ section.` : undefined}
                onConfirm={() => deleteId !== null && onDelete(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}

// Each static page has its own dedicated component (not one generic
// renderer) so About/Shipping & Returns/Privacy Policy/Terms can diverge in
// layout independently later — this just picks the right one by slug.
function StaticPagePreview({ slug, page }: { slug: string; page: StaticPage }) {
    switch (slug) {
        case "about":
            return <AboutPage page={page} preview />;
        case "shipping-returns":
            return <ShippingReturnsPage page={page} preview />;
        case "privacy-policy":
            return <PrivacyPolicyPage page={page} preview />;
        case "terms":
            return <TermsPage page={page} preview />;
        default:
            return null;
    }
}

// Keyed by page.id from the parent, so navigating between two different
// pages remounts this fresh instead of needing an effect to reset `content`.
function PageContentEditor({
    page,
    onSave,
    onBack,
}: {
    page: StaticPage;
    onSave: (id: number, content: string) => void;
    onBack: () => void;
}) {
    const [content, setContent] = useState(page.content);

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <button onClick={onBack} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Pages
                </button>
                <button onClick={() => onSave(page.id, content)} className={BTN_PRIMARY + " px-6 py-3"}>
                    Save Page
                </button>
            </div>
            <div className="grid grid-cols-1 overflow-hidden border border-ink/10 bg-white lg:grid-cols-2">
                <div className="p-7">
                    <h3 className="mb-4 text-lg font-medium text-ink">{page.name}</h3>
                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Last Updated</label>
                        <input disabled value={page.updated} className={FIELD_INPUT} />
                    </div>
                    <div>
                        <label className={FIELD_LABEL}>Page Content</label>
                        <textarea
                            rows={14}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className={`${FIELD_INPUT} resize-y leading-relaxed`}
                        />
                    </div>
                </div>
                <LivePreviewPane label={`cindyrella.ph/pages/${page.slug}`}>
                    <StaticPagePreview slug={page.slug} page={{ ...page, content }} />
                </LivePreviewPane>
            </div>
        </div>
    );
}

export default function PageEditorPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();
    const { pages, updatePageContent, faqs, addFaq, updateFaq, deleteFaq, moveFaq } = useContent();
    const page = pages.find((p) => p.slug === params.slug);

    function backToPages() {
        router.push("/admin/content?tab=pages");
    }

    if (params.slug === "hero") {
        return <HeroEditor onBack={backToPages} />;
    }

    if (params.slug === "shop" || params.slug === "wishlist" || params.slug === "cart") {
        return <PageIntroEditor pageKey={params.slug as PageIntroKey} onBack={backToPages} />;
    }

    if (!page) {
        return (
            <div className="p-11 text-center text-[13px] text-grey">
                Page not found.{" "}
                <button onClick={backToPages} className="text-pink-dark underline">
                    Back to Pages
                </button>
            </div>
        );
    }

    if (params.slug === "faq") {
        return <FaqEditor faqs={faqs} onAdd={addFaq} onUpdate={updateFaq} onDelete={deleteFaq} onMove={moveFaq} onBack={backToPages} />;
    }

    return <PageContentEditor key={page.id} page={page} onSave={updatePageContent} onBack={backToPages} />;
}
