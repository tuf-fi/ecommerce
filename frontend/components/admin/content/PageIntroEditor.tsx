"use client";

import { toast } from "sonner";
import { PageIntroKey, useContent } from "@/library/content";
import LivePreviewPane from "../LivePreviewPane";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "../formClasses";

const PAGE_META: Record<PageIntroKey, { name: string; path: string }> = {
    shop: { name: "Shop", path: "/shop" },
    wishlist: { name: "Wishlist", path: "/wishlist" },
    cart: { name: "Cart", path: "/cart" },
};

export default function PageIntroEditor({ pageKey, onBack }: { pageKey: PageIntroKey; onBack: () => void }) {
    const { pageIntros, updatePageIntro } = useContent();
    const intro = pageIntros[pageKey];
    const meta = PAGE_META[pageKey];

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <button onClick={onBack} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Pages
                </button>
                <button onClick={() => toast.success(`${meta.name} intro saved.`)} className={BTN_PRIMARY + " px-6 py-3"}>
                    Save Changes
                </button>
            </div>
            <div className="grid grid-cols-1 overflow-hidden border border-ink/10 bg-white lg:grid-cols-2">
                <div className="p-7">
                    <h3 className="mb-4 text-lg font-medium text-ink">{meta.name} Page Intro</h3>
                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Headline (first line)</label>
                        <input
                            value={intro.headline}
                            onChange={(e) => updatePageIntro(pageKey, { headline: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div>
                        <label className={FIELD_LABEL}>Accent (highlighted line)</label>
                        <input
                            value={intro.accent}
                            onChange={(e) => updatePageIntro(pageKey, { accent: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                </div>

                <LivePreviewPane label={`cindyrella.ph${meta.path}`}>
                    <h1 className="mt-3 mb-0 max-w-none text-[26px] leading-[1.1] font-normal">
                        {intro.headline} <br />
                        <em className="pink-highlight font-normal">{intro.accent}</em>
                    </h1>
                </LivePreviewPane>
            </div>
        </div>
    );
}
