"use client";

import { PageIntroContent, PageIntroKey, useContent } from "@/library/content";

// Not CMS-editable: fixed short label per route, same role as SectionTitle's "title" but without a number since these routes aren't a sequence.
const PAGE_LABEL: Record<PageIntroKey, string> = {
    shop: "Shop All",
    wishlist: "Saved",
    cart: "Your Bag",
    journal: "Journal",
};

// Shared by /shop, /wishlist, /cart, and the admin preview pane so headline markup lives in one place; previewData carries the editor's unsaved draft.
export default function PageIntro({
    pageKey,
    preview = false,
    previewData,
}: {
    pageKey: PageIntroKey;
    preview?: boolean;
    previewData?: PageIntroContent;
}) {
    const { pageIntros } = useContent();
    const intro = previewData ?? pageIntros[pageKey];

    return (
        <div className={preview ? "px-9 py-6" : "mb-11"}>
            {!preview && (
                <div className="mb-4 flex items-center gap-x-5">
                    <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-grey">{PAGE_LABEL[pageKey]}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-grey-light to-transparent" />
                </div>
            )}
            <h1
                className={
                    preview
                        ? "max-w-none text-[26px] leading-[1.1] font-normal"
                        : "mt-3 max-w-none text-[30px] leading-[1.08] font-normal sm:text-[38px] lg:text-[42px]"
                }
            >
                {intro.headline} <br />
                <em className="pink-highlight font-normal">{intro.accent}</em>
            </h1>
        </div>
    );
}
