"use client";

import { PageIntroContent, PageIntroKey, useContent } from "@/library/content";

// Shared by the real /shop, /wishlist, and /cart routes and the admin's
// live-preview pane (mirrors the Hero.tsx pattern) so the two can never
// drift apart — there is only one place this headline markup is written.
// `previewData` lets PageIntroEditor feed in its local unsaved draft — see Hero.tsx.
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
        <h1
            className={
                preview
                    ? "px-9 py-6 max-w-none text-[26px] leading-[1.1] font-normal"
                    : "mt-3 mb-11 max-w-none text-[30px] leading-[1.08] font-normal sm:text-[38px] lg:text-[42px]"
            }
        >
            {intro.headline} <br />
            <em className="pink-highlight font-normal">{intro.accent}</em>
        </h1>
    );
}
