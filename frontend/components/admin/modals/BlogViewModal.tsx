"use client";

import Modal from "@/components/ui/Modal";
import JournalArticle from "@/components/sections/JournalArticle";
import { BlogPost } from "@/library/admin/types";

// Read-only — no edit/delete controls in here. Editing and removing both
// live in the table (BlogTab); this is purely "what does this look like".
export default function BlogViewModal({ post, onClose }: { post: BlogPost | null; onClose: () => void }) {
    if (!post) return null;

    return (
        <Modal open onClose={onClose} maxWidth="max-w-[520px]">
            <div className="p-8">
                <JournalArticle post={post} preview />
            </div>
        </Modal>
    );
}
