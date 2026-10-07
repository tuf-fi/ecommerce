"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { BlogPost, BlogStatus } from "@/library/admin/types";
import JournalArticle from "@/components/sections/JournalArticle";
import ContentEditorShell, { ContentEditorSkeleton, ContentNotFound } from "@/components/admin/content/ContentEditorShell";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { useMounted } from "@/library/useMounted";
import { validateAndReadImage } from "@/library/image-upload";
import { toast } from "sonner";

const BACK_HREF = "/admin/content?tab=blog";

function resolveInitialImage(post: BlogPost | null): string | null {
    if (!post || !post.image) return null;
    return typeof post.image === "string" ? post.image : post.image.src;
}

// Keyed by existing?.id ?? "new" so switching posts remounts fresh instead of needing a reset effect.
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
    const [errors, setErrors] = useState<{ title?: string }>({});

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = await validateAndReadImage(file);
        if (!result.ok) {
            toast.error(result.reason);
            return;
        }
        setImage(result.url);
        setDirty(true);
    }

    const [saving, handleSave] = useAsyncAction(async () => {
        if (!title.trim()) {
            setErrors({ title: "Title is required." });
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
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
            title={title.trim() || (isNew ? "New Post" : "Post")}
            backLabel="Blog"
            backHref={BACK_HREF}
            saving={saving}
            onSave={handleSave}
            saveLabel="Save Post"
            dirty={dirty}
            preview={<JournalArticle post={{ id: existing?.id ?? 0, title, excerpt, content, status, image, date: existing?.date ?? "" }} preview />}
            featuredImage={
                <label className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden border border-dashed border-ink/20 bg-off/50 transition hover:border-ink/35">
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-center font-mono text-[10px] tracking-[.08em] text-ink/60 uppercase">+ Set image</span>
                    )}
                    {image && (
                        <span className="absolute inset-0 flex items-center justify-center bg-navy/60 text-[11.5px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                            Replace
                        </span>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
            }
            meta={
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
            }
        >
            <div className="mb-4">
                <label htmlFor="blog-title" className={FIELD_LABEL}>Title</label>
                <input
                    id="blog-title"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        setDirty(true);
                        if (errors.title) setErrors({});
                    }}
                    placeholder="e.g. 5 Steps to Layer Your Routine"
                    aria-invalid={errors.title ? true : undefined}
                    className={`${FIELD_INPUT} ${errors.title ? FIELD_INPUT_INVALID : ""}`}
                />
                {errors.title && <p className={FIELD_ERROR}>{errors.title}</p>}
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

function BlogEditorSkeleton() {
    return (
        <ContentEditorSkeleton
            meta="field"
            image
            fields={[
                { labelWidth: "w-10", height: "h-[46px]" },
                { labelWidth: "w-14", height: "h-[117px]" },
                { labelWidth: "w-9", height: "h-[254px]" },
            ]}
        />
    );
}
