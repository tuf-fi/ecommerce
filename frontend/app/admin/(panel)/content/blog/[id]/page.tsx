"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { BlogPost, BlogStatus } from "@/library/admin/types";
import LivePreviewPane from "@/components/admin/LivePreviewPane";
import JournalArticle from "@/components/sections/JournalArticle";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";

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
    onBack,
}: {
    existing: BlogPost | null;
    isNew: boolean;
    onSave: (data: Omit<BlogPost, "id">, id?: number) => void;
    onBack: () => void;
}) {
    const [title, setTitle] = useState(existing?.title ?? "");
    const [excerpt, setExcerpt] = useState(existing?.excerpt ?? "");
    const [content, setContent] = useState(existing?.content ?? "");
    const [status, setStatus] = useState<BlogStatus>(existing?.status ?? "Draft");
    const [image, setImage] = useState<string | null>(resolveInitialImage(existing));

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    }

    function handleSave() {
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        if (isNew) {
            onSave({ title, excerpt, content, status, image, date: today });
        } else if (existing) {
            onSave({ title, excerpt, content, status, image, date: existing.date }, existing.id);
        }
        onBack();
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <button onClick={onBack} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Blog
                </button>
                <button onClick={handleSave} className={BTN_PRIMARY + " px-6 py-3"}>
                    Save Post
                </button>
            </div>

            <div className="grid grid-cols-1 overflow-hidden border border-ink/10 bg-white lg:grid-cols-2">
                <div className="p-7">
                    <h3 className="mb-4 text-lg font-medium text-ink">{isNew ? "New Post" : "Post"}</h3>

                    <label className="relative mb-5 block h-[150px] w-full cursor-pointer overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                        {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center font-mono text-[12px] text-ink/60">+ Add featured image</span>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>

                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 5 Steps to Layer Your Routine" className={FIELD_INPUT} />
                    </div>
                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Excerpt</label>
                        <textarea
                            rows={4}
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="A short summary shown on the blog index"
                            className={`${FIELD_INPUT} resize-y leading-relaxed`}
                        />
                    </div>
                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Body</label>
                        <textarea
                            rows={10}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="The full article — separate paragraphs with a blank line"
                            className={`${FIELD_INPUT} resize-y leading-relaxed`}
                        />
                    </div>
                    <div>
                        <label className={FIELD_LABEL}>Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value as BlogStatus)} className={FIELD_INPUT}>
                            <option>Draft</option>
                            <option>Published</option>
                        </select>
                    </div>
                </div>

                <LivePreviewPane label="cindyrella.ph/journal/…">
                    <JournalArticle post={{ id: existing?.id ?? 0, title, excerpt, content, status, image, date: existing?.date ?? "" }} preview />
                </LivePreviewPane>
            </div>
        </div>
    );
}

export default function BlogEditorPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { blogPosts, addBlogPost, updateBlogPost } = useContent();
    const isNew = params.id === "new";
    const existing = isNew ? null : (blogPosts.find((b) => b.id === Number(params.id)) ?? null);

    function backToBlog() {
        router.push("/admin/content?tab=blog");
    }

    if (!isNew && !existing) {
        return (
            <div className="p-11 text-center text-[13px] text-grey">
                Post not found.{" "}
                <button onClick={backToBlog} className="text-pink-dark underline">
                    Back to Blog
                </button>
            </div>
        );
    }

    function handleSave(data: Omit<BlogPost, "id">, id?: number) {
        if (id) updateBlogPost(id, data);
        else addBlogPost(data);
    }

    return <BlogEditorForm key={existing?.id ?? "new"} existing={existing} isNew={isNew} onSave={handleSave} onBack={backToBlog} />;
}
