"use client";

import { toast } from "sonner";
import { useContent } from "@/library/content";
import Hero from "@/components/sections/Hero";
import LivePreviewPane from "../LivePreviewPane";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "../formClasses";

export default function HeroEditor({ onBack }: { onBack: () => void }) {
    const { hero, updateHero } = useContent();

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => updateHero({ image: reader.result as string });
        reader.readAsDataURL(file);
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <button onClick={onBack} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Pages
                </button>
                <button onClick={() => toast.success("Hero content saved.")} className={BTN_PRIMARY + " px-6 py-3"}>
                    Save Changes
                </button>
            </div>
            <div className="grid grid-cols-1 overflow-hidden border border-ink/10 bg-white lg:grid-cols-2">
                <div className="p-7">
                    <h3 className="mb-4 text-lg font-medium text-ink">Hero</h3>
                    <label className="relative mb-5 block h-40 w-full cursor-pointer overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft">
                        {hero.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={hero.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center font-mono text-[12px] text-ink/60">+ Add hero image</span>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>

                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Hero Headline</label>
                        <input value={hero.headline} onChange={(e) => updateHero({ headline: e.target.value })} className={FIELD_INPUT} />
                    </div>
                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Hero CTA Button Text</label>
                        <input value={hero.cta} onChange={(e) => updateHero({ cta: e.target.value })} className={FIELD_INPUT} />
                    </div>
                    <div>
                        <label className={FIELD_LABEL}>Hero Subtext</label>
                        <textarea
                            rows={2}
                            value={hero.subtext}
                            onChange={(e) => updateHero({ subtext: e.target.value })}
                            className={`${FIELD_INPUT} resize-y leading-relaxed`}
                        />
                    </div>
                </div>

                <LivePreviewPane label="cindyrella.ph">
                    <Hero preview />
                </LivePreviewPane>
            </div>
        </div>
    );
}
