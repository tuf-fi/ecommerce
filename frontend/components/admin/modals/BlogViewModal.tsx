"use client";

import Modal from "@/components/ui/Modal";
import { ViewHeader } from "@/components/admin/modals/ViewModalLayout";
import JournalArticle from "@/components/sections/JournalArticle";
import { BlogPost } from "@/library/admin/types";

// Read-only — no edit/delete controls in here. Editing and removing both
// live in the table (BlogTab); this is purely "what does this look like".
export default function BlogViewModal({ post, onClose }: { post: BlogPost | null; onClose: () => void }) {
    if (!post) return null;

    return (
        <Modal open onClose={onClose} maxWidth="max-w-[520px]">
            <ViewHeader eyebrow="Blog Post · Preview" title={post.title} />
            <div className="pb-2">
                <JournalArticle post={post} preview />
            </div>
        </Modal>
    );
}
