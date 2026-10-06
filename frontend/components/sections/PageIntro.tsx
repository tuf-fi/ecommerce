"use client";

import { PageIntroContent, PageIntroKey, useContent } from "@/library/content";

// Fixed short label per route (not CMS-editable), shown above the headline.
const PAGE_LABEL: Record<PageIntroKey, string> = {
    shop: "Shop All",
    wishlist: "Your Wishlist",
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
        <div className={preview ? "px-9 py-6" : "mb-8 border-b border-ink/10 pb-8 md:mb-12 md:pb-10"}>
            {!preview && <span className="mb-8 flex min-h-11 items-center font-mono text-[10.5px] uppercase tracking-[.16em] text-grey md:mb-10">{PAGE_LABEL[pageKey]}</span>}
            <h1
                className={
                    preview
                        ? "max-w-none text-[26px] leading-[1.1] font-normal"
                        : "mb-0 max-w-none text-[30px] leading-[1.08] font-normal sm:text-[38px] lg:text-[42px]"
                }
            >
                {intro.headline} <br />
                <em className="pink-highlight font-normal">{intro.accent}</em>
            </h1>
        </div>
    );
}
