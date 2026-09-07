"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { BlogPost, BlogStatus } from "@/library/admin/types";
import JournalArticle from "@/components/sections/JournalArticle";
import ContentEditorShell, { ContentNotFound } from "@/components/admin/content/ContentEditorShell";
import { FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

const BACK_HREF = "/admin/content?tab=blog";

function resolveInitialImage(post: BlogPost | null): string | null {
    if (!post || !post.image) return null;
    return typeof post.image === "string" ? post.image : post.image.src;
}

// Keyed by existing?.id ?? "new" from the parent, so switching between two
// different posts (or from a post into "add new") remounts this fresh
// instead of needing an effect to reset the form. Always editable — read-only
// viewing is BlogViewModal's job (opened from the table); this page is only
// ever reached via the table's Edit action or "+ New Post".
function BlogEditorForm({
    existing,
    isNew,
    onSave,
}: {
    existing: BlogPost | null;
    isNew: boolean;
    onSave: (data: Omit<BlogPost, "id">, id?: number) => void;
}) {
    const router = useRouter();
    const [title, setTitle] = useState(existing?.title ?? "");
    const [excerpt, setExcerpt] = useState(existing?.excerpt ?? "");
    const [content, setContent] = useState(existing?.content ?? "");
    const [status, setStatus] = useState<BlogStatus>(existing?.status ?? "Draft");
    const [image, setImage] = useState<string | null>(resolveInitialImage(existing));
    const [dirty, setDirty] = useState(false);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result as string);
            setDirty(true);
        };
        reader.readAsDataURL(file);
    }

    const [saving, handleSave] = useAsyncAction(async () => {
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        await wait();
        if (isNew) {
            onSave({ title, excerpt, content, status, image, date: today });
        } else if (existing) {
            onSave({ title, excerpt, content, status, image, date: existing.date }, existing.id);
        }
        setDirty(false);
        router.push(BACK_HREF);
    });

    return (
        <ContentEditorShell
            title={isNew ? "New Post" : "Post"}
            backLabel="Blog"
            backHref={BACK_HREF}
            saving={saving}
            onSave={handleSave}
            saveLabel="Save Post"
            dirty={dirty}
            previewLabel="cindyrella.ph/journal/…"
            preview={<JournalArticle post={{ id: existing?.id ?? 0, title, excerpt, content, status, image, date: existing?.date ?? "" }} preview />}
        >
            {/* Small square, not a full-width preview — the actual image is
                already visible full-size in the live preview above. */}
            <div className="mb-5 flex items-center gap-3.5">
                <label className="relative h-16 w-16 flex-none cursor-pointer overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-center font-mono text-[9px] text-ink/60">+ Image</span>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <span className="text-[11.5px] text-grey">Shown full-size in the live preview above</span>
            </div>

            <div className="mb-4">
                <label htmlFor="blog-title" className={FIELD_LABEL}>Title</label>
                <input
                    id="blog-title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setDirty(true);
                    }}
                    placeholder="e.g. 5 Steps to Layer Your Routine"
                    className={FIELD_INPUT}
                />
            </div>
            <div className="mb-4">
                <label htmlFor="blog-excerpt" className={FIELD_LABEL}>Excerpt</label>
                <textarea
                    id="blog-excerpt"
                    rows={4}
                    value={excerpt}
                    onChange={(e) => {
                        setExcerpt(e.target.value);
                        setDirty(true);
                    }}
                    placeholder="A short summary shown on the blog index"
                    className={`${FIELD_INPUT} resize-y leading-relaxed`}
                />
            </div>
            <div className="mb-4">
                <label htmlFor="blog-body" className={FIELD_LABEL}>Body</label>
                <textarea
                    id="blog-body"
                    rows={10}
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        setDirty(true);
                    }}
                    placeholder="The full article — separate paragraphs with a blank line"
                    className={`${FIELD_INPUT} resize-y leading-relaxed`}
                />
            </div>
            <div>
                <label htmlFor="blog-status" className={FIELD_LABEL}>Status</label>
                <select
                    id="blog-status"
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value as BlogStatus);
                        setDirty(true);
                    }}
                    className={FIELD_INPUT}
                >
                    <option>Draft</option>
                    <option>Published</option>
                </select>
            </div>
        </ContentEditorShell>
    );
}

export default function BlogEditorPage() {
    const params = useParams<{ id: string }>();
    const { blogPosts, addBlogPost, updateBlogPost } = useContent();
    const mounted = useMounted();
    const isNew = params.id === "new";
    const existing = isNew ? null : (blogPosts.find((b) => b.id === Number(params.id)) ?? null);

    if (!mounted) return <BlogEditorSkeleton />;

    if (!isNew && !existing) {
        return <ContentNotFound message="Post not found." backLabel="Back to Blog" backHref={BACK_HREF} />;
    }

    function handleSave(data: Omit<BlogPost, "id">, id?: number) {
        if (id) updateBlogPost(id, data);
        else addBlogPost(data);
    }

    return <BlogEditorForm key={existing?.id ?? "new"} existing={existing} isNew={isNew} onSave={handleSave} />;
}

// Mirrors ContentEditorShell's stacked shape (back link, then one bordered
// box holding the live-preview bar + a tall article-shaped preview area on
// top, and the form below) plus BlogEditorForm's own fields: image square,
// title input, excerpt textarea, body textarea, status select.
function BlogEditorSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 flex items-center justify-between gap-4">
                <Skeleton className="h-[12.5px] w-28" />
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <div className="border-b border-ink/10">
                    <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5">
                        <Skeleton tone="soft" className="h-[10.5px] w-40" />
                        <div className="flex items-center gap-1">
                            <Skeleton tone="soft" className="h-6 w-6" />
                            <Skeleton tone="soft" className="h-6 w-6" />
                            <Skeleton tone="soft" className="h-6 w-6" />
                        </div>
                    </div>
                    <Skeleton tone="faint" className="h-64 w-full" />
                </div>

                <div className="px-7 pt-10 pb-7">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <Skeleton className="h-[18px] w-24" />
                    </div>

                    <div className="mb-5 flex items-center gap-3.5">
                        <Skeleton tone="faint" className="h-16 w-16 flex-none" />
                        <Skeleton tone="soft" className="h-[11.5px] w-56" />
                    </div>

                    <div className="mb-4">
                        <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-10" />
                        <Skeleton tone="outline" className="h-11 w-full" />
                    </div>
                    <div className="mb-4">
                        <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-14" />
                        <Skeleton tone="outline" className="h-24 w-full" />
                    </div>
                    <div className="mb-4">
                        <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-9" />
                        <Skeleton tone="outline" className="h-52 w-full" />
                    </div>
                    <div>
                        <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-12" />
                        <Skeleton tone="outline" className="h-11 w-full" />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-4">
                <Skeleton tone="outline" className="h-[46px] w-40" />
            </div>
        </SkeletonGroup>
    );
}
