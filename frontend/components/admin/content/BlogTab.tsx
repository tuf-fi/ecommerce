"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useContent } from "@/library/content";
import { BlogPost } from "@/library/admin/types";
import SearchField from "@/components/admin/SearchField";
import Toggle from "@/components/ui/Toggle";
import Pagination from "@/components/ui/Pagination";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import BlogViewModal from "@/components/admin/modals/BlogViewModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";

const PAGE_SIZE = 10;

export default function BlogTab() {
    const { blogPosts, updateBlogPost, deleteBlogPost } = useContent();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [viewing, setViewing] = useState<BlogPost | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleting = blogPosts.find((b) => b.id === deleteId) ?? null;

    const filtered = useMemo(() => {
        if (!search.trim()) return blogPosts;
        const q = search.trim().toLowerCase();
        return blogPosts.filter((b) => b.title.toLowerCase().includes(q));
    }, [blogPosts, search]);

    // Reset to page 1 whenever the search term changes — a render-time state
    // adjustment rather than an effect (see InventoryPage for the pattern).
    const [prevSearch, setPrevSearch] = useState(search);
    if (search !== prevSearch) {
        setPrevSearch(search);
        setPage(1);
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div>
            <div className="mb-5 flex items-center justify-between gap-4">
                <SearchField value={search} onChange={setSearch} placeholder="Search posts" />
                <Link href="/admin/content/blog/new" className={`flex-none ${BTN_ADD}`}>
                    + New Post
                </Link>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-off/50">
                            {["Title", "Status", "Date", ""].map((h) => (
                                <th key={h} className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-5 py-16 text-center text-[13px] text-grey">
                                    No posts match this search.
                                </td>
                            </tr>
                        )}
                        {paged.map((b) => (
                            <tr key={b.id} className="transition hover:bg-off/40">
                                <td className="border-b border-ink/10 px-5 py-3.5 text-[13.5px] font-medium text-ink">
                                    <button onClick={() => setViewing(b)} className="block truncate text-left hover:text-pink-dark">
                                        {b.title}
                                    </button>
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3.5">
                                    <Toggle
                                        checked={b.status === "Published"}
                                        onChange={(checked) => updateBlogPost(b.id, { status: checked ? "Published" : "Draft" })}
                                    />
                                </td>
                                <td className="border-b border-ink/10 px-5 py-3.5 font-mono text-[12px] text-grey">{b.date}</td>
                                <td className="border-b border-ink/10 px-5 py-3.5">
                                    <div className="flex items-center justify-end gap-2">
                                        <Tooltip label="Edit">
                                            <Link href={`/admin/content/blog/${b.id}`} aria-label="Edit post" className={ICON_BTN}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M12 20h9" />
                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                </svg>
                                            </Link>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setDeleteId(b.id)} aria-label="Remove post" className={ICON_BTN_DANGER}>
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
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <BlogViewModal post={viewing} onClose={() => setViewing(null)} />

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this post?"
                description={deleting ? `"${deleting.title}" will be removed from the Journal.` : undefined}
                onConfirm={() => deleteId !== null && deleteBlogPost(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
