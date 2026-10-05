"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContent } from "@/library/content";
import { Promo } from "@/library/admin/types";
import PromoBanner from "@/components/layout/PromoBanner";
import Toggle from "@/components/ui/Toggle";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ContentEditorShell, { ContentNotFound } from "@/components/admin/content/ContentEditorShell";
import { FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_LABEL, FIELD_ERROR, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
import { validateAndReadImage } from "@/library/image-upload";
import { toast } from "sonner";

const BACK_HREF = "/admin/content?tab=promotions";

// Keyed by existing?.id ?? "new" so switching promotions remounts fresh instead of needing a reset effect.
function PromoEditorForm({
    existing,
    isNew,
    onSave,
    onDelete,
}: {
    existing: Promo | null;
    isNew: boolean;
    onSave: (data: Omit<Promo, "id">, id?: number) => void;
    onDelete: (id: number) => void;
}) {
    const router = useRouter();
    const [mode, setMode] = useState<"view" | "edit">(isNew ? "edit" : "view");
    const [text, setText] = useState(existing?.text ?? "");
    const [code, setCode] = useState(existing?.code ?? "");
    const [active, setActive] = useState(existing?.active ?? false);
    const [image, setImage] = useState<string | null>(existing?.image ?? null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [errors, setErrors] = useState<{ text?: string }>({});

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
        if (!text.trim()) {
            setErrors({ text: "Promo text is required." });
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
        await wait();
        if (isNew) {
            onSave({ text, code, image, active });
            setDirty(false);
            router.push(BACK_HREF);
        } else if (existing) {
            onSave({ text, code, image, active }, existing.id);
            setDirty(false);
            setMode("view");
        }
    });

    const disabled = mode === "view";

    return (
        <ContentEditorShell
            title={isNew ? "Add Promotion" : "Promotion"}
            backLabel="Promotions"
            backHref={BACK_HREF}
            saving={saving}
            onSave={handleSave}
            saveLabel="Save Promotion"
            showSaveBar={mode === "edit"}
            dirty={dirty}
            topRightExtra={
                !isNew && mode === "view" ? (
                    <>
                        <Tooltip label="Delete">
                            <button onClick={() => setConfirmOpen(true)} aria-label="Delete promotion" className={ICON_BTN_DANGER}>
                                <TrashIcon />
                            </button>
                        </Tooltip>
                        <Tooltip label="Edit">
                            <button onClick={() => setMode("edit")} aria-label="Edit promotion" className={ICON_BTN}>
                                <EditIcon />
                            </button>
                        </Tooltip>
                    </>
                ) : undefined
            }
            preview={
                active ? (
                    <PromoBanner promo={{ id: existing?.id ?? 0, text, code, image, active }} />
                ) : (
                    <p className="p-6 text-center text-[12.5px] text-grey">
                        This promotion is turned off — it won&apos;t show on the site until &quot;Display this promo&quot; is on.
                    </p>
                )
            }
            featuredImage={
                <label className={`group relative flex aspect-video w-full items-center justify-center overflow-hidden border border-dashed border-ink/20 bg-off/50 transition ${disabled ? "" : "cursor-pointer hover:border-ink/35"}`}>
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-center font-mono text-[10px] tracking-[.08em] text-ink/60 uppercase">+ Set image</span>
                    )}
                    {!disabled && image && (
                        <span className="absolute inset-0 flex items-center justify-center bg-navy/60 text-[11.5px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                            Replace
                        </span>
                    )}
                    {!disabled && <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />}
                </label>
            }
            meta={
                <div className="flex items-center justify-between">
                    <label htmlFor="promo-display-toggle" className="text-[13px] text-ink">Display this promo</label>
                    <Toggle
                        id="promo-display-toggle"
                        checked={active}
                        onChange={
                            disabled
                                ? () => {}
                                : (v) => {
                                      setActive(v);
                                      setDirty(true);
                                  }
                        }
                    />
                </div>
            }
        >
            <div className="mb-4">
                <label htmlFor="promo-text" className={FIELD_LABEL}>Promo Text</label>
                <textarea
                    id="promo-text"
                    rows={2}
                    disabled={disabled}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setDirty(true);
                        if (errors.text) setErrors({});
                    }}
                    placeholder="e.g. 10% off your first order"
                    aria-invalid={errors.text ? true : undefined}
                    className={`${FIELD_INPUT} resize-y ${errors.text ? FIELD_INPUT_INVALID : ""}`}
                />
                {errors.text && <p className={FIELD_ERROR}>{errors.text}</p>}
            </div>
            <div className="mb-5">
                <label htmlFor="promo-code" className={FIELD_LABEL}>Promo Code (optional)</label>
                <input
                    id="promo-code"
                    disabled={disabled}
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value);
                        setDirty(true);
                    }}
                    placeholder="e.g. RITUAL10"
                    className={FIELD_INPUT}
                />
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Remove this promotion?"
                description={existing ? `"${existing.text}" will no longer show on the site.` : undefined}
                onConfirm={() => {
                    if (existing) onDelete(existing.id);
                    router.push(BACK_HREF);
                }}
                onClose={() => setConfirmOpen(false)}
            />
        </ContentEditorShell>
    );
}

export default function PromoEditorPage() {
    const params = useParams<{ id: string }>();
    const { promos, addPromo, updatePromo, deletePromo } = useContent();
    const mounted = useMounted();
    const isNew = params.id === "new";
    const existing = isNew ? null : (promos.find((p) => p.id === Number(params.id)) ?? null);

    if (!mounted) return <PromoEditorSkeleton />;

    if (!isNew && !existing) {
        return <ContentNotFound message="Promotion not found." backLabel="Back to Promotions" backHref={BACK_HREF} />;
    }

    function handleSave(data: Omit<Promo, "id">, id?: number) {
        if (id) updatePromo(id, data);
        else addPromo(data);
    }

    return <PromoEditorForm key={existing?.id ?? "new"} existing={existing} isNew={isNew} onSave={handleSave} onDelete={deletePromo} />;
}

function PromoEditorSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 flex items-center justify-between gap-4">
                <Skeleton className="h-[12.5px] w-28" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="overflow-hidden border border-ink/10 bg-white">
                    <div className="border-b border-ink/10 px-7 py-5">
                        <Skeleton className="h-[18px] w-28" />
                    </div>
                    <div className="border-b border-ink/10">
                        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5">
                            <Skeleton tone="soft" className="h-[10.5px] w-44" />
                            <div className="flex items-center gap-1">
                                <Skeleton tone="soft" className="h-6 w-6" />
                                <Skeleton tone="soft" className="h-6 w-6" />
                                <Skeleton tone="soft" className="h-6 w-6" />
                            </div>
                        </div>
                        <Skeleton tone="faint" className="h-10 w-full" />
                    </div>

                    <div className="px-7 py-7">
                        <div className="mb-4">
                            <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-20" />
                            <Skeleton tone="outline" className="h-16 w-full" />
                        </div>
                        <div>
                            <Skeleton tone="soft" className="mb-1.5 h-[10.5px] w-28" />
                            <Skeleton tone="outline" className="h-11 w-full" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    <div className="overflow-hidden border border-ink/10 bg-white">
                        <div className="border-b border-ink/10 bg-off/50 px-4 py-2.5">
                            <Skeleton tone="soft" className="h-[10px] w-14" />
                        </div>
                        <div className="p-4">
                            <Skeleton tone="soft" className="mb-3.5 h-[10.5px] w-20" />
                            <Skeleton tone="outline" className="h-11 w-full" />
                        </div>
                    </div>
                    <div className="overflow-hidden border border-ink/10 bg-white">
                        <div className="border-b border-ink/10 bg-off/50 px-4 py-2.5">
                            <Skeleton tone="soft" className="h-[10px] w-24" />
                        </div>
                        <div className="p-4">
                            <Skeleton tone="faint" className="aspect-video w-full" />
                        </div>
                    </div>
                    <div className="overflow-hidden border border-ink/10 bg-white">
                        <div className="border-b border-ink/10 bg-off/50 px-4 py-2.5">
                            <Skeleton tone="soft" className="h-[10px] w-14" />
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <Skeleton tone="soft" className="h-[13px] w-24" />
                            <Skeleton tone="outline" className="h-6 w-11" />
                        </div>
                    </div>
                </div>
            </div>
        </SkeletonGroup>
    );
}
