"use client";

import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/admin/StatusBadge";
import { ViewHeader } from "@/components/admin/modals/ViewModalLayout";
import JournalArticle from "@/components/sections/JournalArticle";
import { BlogPost } from "@/library/admin/types";

// Read-only — editing/deleting lives in the table (BlogTab), not here.
export default function BlogViewModal({ post, onClose }: { post: BlogPost | null; onClose: () => void }) {
    if (!post) return null;

    return (
        <Modal open onClose={onClose} maxWidth="max-w-[520px]">
            <ViewHeader title={post.title} badge={<StatusBadge label="Preview" tone="neutral" />} />
            <div className="pb-2">
                <JournalArticle post={post} preview />
            </div>
        </Modal>
    );
}
