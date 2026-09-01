"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { Promo } from "@/library/admin/types";
import LivePreviewPane from "@/components/admin/LivePreviewPane";
import PromoBanner from "@/components/layout/PromoBanner";
import Toggle from "@/components/ui/Toggle";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";

// Keyed by existing?.id ?? "new" from the parent, so switching between two
// different promotions (or from a promotion into "add new") remounts this
// fresh instead of needing an effect to reset the form.
function PromoEditorForm({
    existing,
    isNew,
    onSave,
    onDelete,
    onBack,
}: {
    existing: Promo | null;
    isNew: boolean;
    onSave: (data: Omit<Promo, "id">, id?: number) => void;
    onDelete: (id: number) => void;
    onBack: () => void;
}) {
    const [mode, setMode] = useState<"view" | "edit">(isNew ? "edit" : "view");
    const [text, setText] = useState(existing?.text ?? "");
    const [code, setCode] = useState(existing?.code ?? "");
    const [active, setActive] = useState(existing?.active ?? false);
    const [image, setImage] = useState<string | null>(existing?.image ?? null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    }

    function handleSave() {
        if (isNew) {
            onSave({ text, code, image, active });
            onBack();
        } else if (existing) {
            onSave({ text, code, image, active }, existing.id);
            setMode("view");
        }
    }

    const disabled = mode === "view";

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <button onClick={onBack} className="text-[12.5px] font-medium text-ink hover:text-pink-dark">
                    ← Back to Promotions
                </button>
                <div className="flex items-center gap-2.5">
                    {!isNew && mode === "view" && (
                        <Tooltip label="Delete">
                            <button onClick={() => setConfirmOpen(true)} aria-label="Delete promotion" className={ICON_BTN_DANGER}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M4 7h16" />
                                    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                    <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
                                    <path d="M10 11v6M14 11v6" />
                                </svg>
                            </button>
                        </Tooltip>
                    )}
                    {!isNew && mode === "view" && (
                        <Tooltip label="Edit">
                            <button onClick={() => setMode("edit")} aria-label="Edit promotion" className={ICON_BTN}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                </svg>
                            </button>
                        </Tooltip>
                    )}
                    {mode === "edit" && (
                        <button onClick={handleSave} className={BTN_PRIMARY + " px-6 py-3"}>
                            Save Promotion
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 overflow-hidden border border-ink/10 bg-white lg:grid-cols-2">
                <div className="p-7">
                    <h3 className="mb-4 text-lg font-medium text-ink">{isNew ? "Add Promotion" : "Promotion"}</h3>

                    <div className="mb-5 flex items-center gap-3.5">
                        <label className={`relative h-16 w-16 flex-none overflow-hidden bg-gradient-to-br from-blue-soft to-pink-soft ${disabled ? "" : "cursor-pointer"}`}>
                            {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={image} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center text-center font-mono text-[9px] text-ink/60">+ Image</span>
                            )}
                            {!disabled && <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />}
                        </label>
                        <span className="text-[11.5px] text-grey">Optional — reserved for future visual promo cards</span>
                    </div>

                    <div className="mb-4">
                        <label className={FIELD_LABEL}>Promo Text</label>
                        <textarea
                            rows={2}
                            disabled={disabled}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="e.g. 10% off your first order"
                            className={`${FIELD_INPUT} resize-y`}
                        />
                    </div>
                    <div className="mb-5">
                        <label className={FIELD_LABEL}>Promo Code (optional)</label>
                        <input
                            disabled={disabled}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. RITUAL10"
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div className="flex items-center justify-between bg-off/60 px-4 py-3">
                        <label className="text-[13px] text-ink">Display this promo</label>
                        <Toggle checked={active} onChange={disabled ? () => {} : setActive} />
                    </div>
                </div>

                <LivePreviewPane label="Top Banner (all pages)">
                    {active ? (
                        <PromoBanner promo={{ id: existing?.id ?? 0, text, code, image, active }} />
                    ) : (
                        <p className="p-6 text-center text-[12.5px] text-grey">
                            This promotion is turned off — it won&apos;t show on the site until &quot;Display this promo&quot; is on.
                        </p>
                    )}
                </LivePreviewPane>
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Remove this promotion?"
                description={existing ? `"${existing.text}" will no longer show on the site.` : undefined}
                onConfirm={() => {
                    if (existing) onDelete(existing.id);
                    onBack();
                }}
                onClose={() => setConfirmOpen(false)}
            />
        </div>
    );
}

export default function PromoEditorPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { promos, addPromo, updatePromo, deletePromo } = useContent();
    const isNew = params.id === "new";
    const existing = isNew ? null : (promos.find((p) => p.id === Number(params.id)) ?? null);

    function backToPromotions() {
        router.push("/admin/content?tab=promotions");
    }

    if (!isNew && !existing) {
        return (
            <div className="p-11 text-center text-[13px] text-grey">
                Promotion not found.{" "}
                <button onClick={backToPromotions} className="text-pink-dark underline">
                    Back to Promotions
                </button>
            </div>
        );
    }

    function handleSave(data: Omit<Promo, "id">, id?: number) {
        if (id) updatePromo(id, data);
        else addPromo(data);
    }

    return (
        <PromoEditorForm
            key={existing?.id ?? "new"}
            existing={existing}
            isNew={isNew}
            onSave={handleSave}
            onDelete={deletePromo}
            onBack={backToPromotions}
        />
    );
}
