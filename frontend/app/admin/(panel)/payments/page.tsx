"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL, FIELD_TEXTAREA, FORM_PANEL, FORM_PANEL_FOOTER } from "@/components/admin/formClasses";
import { useAdminStore } from "@/library/adminStore";
import { ApiError } from "@/library/api/client";
import { getPaymentInstructions, PaymentInstructions, PaymentMethodDetails, savePaymentInstructions } from "@/library/api/payments";
import { getShippingRule, saveShippingRule } from "@/library/api/adminData";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function PaymentDetailsSettingsPage() {
    const { currentStaffMember } = useAdminStore();
    const [draft, setDraft] = useState<PaymentInstructions | null>(null);
    const [saving, setSaving] = useState(false);
    // Kept as text so a blank "free over" box means "no free-shipping threshold".
    const [shipFlat, setShipFlat] = useState("");
    const [shipFreeOver, setShipFreeOver] = useState("");
    const [savingShip, setSavingShip] = useState(false);
    const isAdministrator = currentStaffMember?.role === "Administrator";

    useEffect(() => {
        let alive = true;
        getPaymentInstructions().then((i) => alive && setDraft(i));
        getShippingRule().then((r) => {
            if (!alive) return;
            setShipFlat(r.flat ? String(r.flat) : "");
            setShipFreeOver(r.freeOver === null ? "" : String(r.freeOver));
        });
        return () => {
            alive = false;
        };
    }, []);

    function setMethod(id: PaymentMethodDetails["id"], patch: Partial<PaymentMethodDetails>) {
        setDraft((d) => d && { ...d, methods: d.methods.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (!draft) return;
        setSaving(true);
        try {
            await savePaymentInstructions({
                intro: draft.intro.trim(),
                methods: draft.methods.map((m) => ({ ...m, accountName: m.accountName.trim(), accountNumber: m.accountNumber.trim(), notes: m.notes.trim() })),
            });
            toast.success("Payment details saved. Customers see them right away.");
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    async function saveShipping(e: React.FormEvent) {
        e.preventDefault();
        const flat = shipFlat.trim() === "" ? 0 : Number(shipFlat);
        const freeOver = shipFreeOver.trim() === "" ? null : Number(shipFreeOver);
        if (!Number.isInteger(flat) || flat < 0 || (freeOver !== null && (!Number.isInteger(freeOver) || freeOver < 0))) {
            toast.error("Use whole pesos, zero or more.");
            return;
        }
        setSavingShip(true);
        try {
            await saveShippingRule({ flat, freeOver });
            toast.success("Shipping saved. Customers see it at checkout right away.");
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
        } finally {
            setSavingShip(false);
        }
    }

    if (!draft) return <PaymentsSkeleton />;

    return (
        <>
        <SettingsSection
            title="Payment Details"
            aside="Customers see these after placing an order, then upload a screenshot of their transfer for you to verify. Leave a method's number blank to hide it."
        >
            {!isAdministrator && (
                <p className="mb-6 border border-ink/10 bg-off/60 px-4 py-3 text-[12.5px] text-ink">
                    Only administrators can change these. You can see what customers see.
                </p>
            )}
            <form onSubmit={save} className={FORM_PANEL}>
                <fieldset disabled={!isAdministrator} className="min-w-0">
                    <div className="p-6 sm:p-7">
                        <label htmlFor="pay-intro" className={FIELD_LABEL}>Message to customers</label>
                        <textarea
                            id="pay-intro"
                            rows={2}
                            value={draft.intro}
                            onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
                            className={FIELD_TEXTAREA}
                        />
                    </div>

                    {draft.methods.map((m) => {
                        const visible = m.accountNumber.trim().length > 0;
                        return (
                            <div key={m.id} className="grid gap-x-5 gap-y-4 border-t border-ink/10 p-6 sm:p-7 lg:grid-cols-[150px_repeat(3,minmax(0,1fr))]">
                                <div className="lg:pt-6">
                                    <h3 className="text-[14px] font-medium text-ink">{m.label}</h3>
                                    <span className={`mt-1.5 flex items-center gap-2 font-mono text-[10.5px] tracking-[.1em] uppercase ${visible ? "text-ink" : "text-grey"}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${visible ? "bg-success" : "bg-ink/25"}`} />
                                        {visible ? "Shown" : "Hidden"}
                                    </span>
                                </div>
                                <div>
                                    <label htmlFor={`pay-${m.id}-number`} className={FIELD_LABEL}>{m.id === "bank" ? "Bank & account no." : "Number"}</label>
                                    <input
                                        id={`pay-${m.id}-number`}
                                        value={m.accountNumber}
                                        onChange={(e) => setMethod(m.id, { accountNumber: e.target.value })}
                                        placeholder={m.id === "bank" ? "BDO 0012 3456 7890" : "0917 000 0000"}
                                        className={FIELD_INPUT}
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`pay-${m.id}-name`} className={FIELD_LABEL}>Account name</label>
                                    <input id={`pay-${m.id}-name`} value={m.accountName} onChange={(e) => setMethod(m.id, { accountName: e.target.value })} className={FIELD_INPUT} />
                                </div>
                                <div>
                                    <label htmlFor={`pay-${m.id}-notes`} className={FIELD_LABEL}>Note (optional)</label>
                                    <input id={`pay-${m.id}-notes`} value={m.notes} onChange={(e) => setMethod(m.id, { notes: e.target.value })} className={FIELD_INPUT} />
                                </div>
                            </div>
                        );
                    })}
                </fieldset>

                {isAdministrator && (
                    <div className={FORM_PANEL_FOOTER}>
                        <button type="submit" disabled={saving} className={`${BTN_PRIMARY} min-w-[200px]`}>
                            {saving ? "Saving…" : "Save payment details"}
                        </button>
                    </div>
                )}
            </form>
        </SettingsSection>

        <SettingsSection title="Shipping" aside="Added to every order at checkout. Leave the fee at 0 for free shipping. Orders at or above the free-shipping amount ship free.">
            <form onSubmit={saveShipping} className={FORM_PANEL}>
                <fieldset disabled={!isAdministrator} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7">
                    <div>
                        <label htmlFor="ship-flat" className={FIELD_LABEL}>Shipping fee</label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-grey">₱</span>
                            <input id="ship-flat" type="number" min={0} value={shipFlat} onChange={(e) => setShipFlat(e.target.value)} placeholder="0" className={`${FIELD_INPUT} pl-9`} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="ship-free" className={FIELD_LABEL}>Free shipping from (optional)</label>
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-grey">₱</span>
                            <input id="ship-free" type="number" min={0} value={shipFreeOver} onChange={(e) => setShipFreeOver(e.target.value)} placeholder="No free-shipping amount" className={`${FIELD_INPUT} pl-9`} />
                        </div>
                    </div>
                </fieldset>
                {isAdministrator && (
                    <div className={FORM_PANEL_FOOTER}>
                        <button type="submit" disabled={savingShip} className={`${BTN_PRIMARY} min-w-[168px]`}>
                            {savingShip ? "Saving…" : "Save shipping"}
                        </button>
                    </div>
                )}
            </form>
        </SettingsSection>
        </>
    );
}

function PaymentsSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-12">
                <div className="mb-6 flex h-10 items-center border-b border-ink/10 pb-4">
                    <Skeleton className="h-[18px] w-40" />
                </div>
                <Skeleton tone="soft" className="mb-7 h-4 w-96 max-w-full" />
                <div className="border border-ink/10">
                    <div className="p-6 sm:p-7">
                        <Skeleton tone="outline" className="h-[94px] w-full" />
                    </div>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="grid gap-x-5 gap-y-4 border-t border-ink/10 p-6 sm:p-7 lg:grid-cols-[150px_repeat(3,minmax(0,1fr))]">
                            <div className="lg:pt-6">
                                <Skeleton className="h-[14px] w-20" />
                                <Skeleton tone="soft" className="mt-1.5 h-[10.5px] w-14" />
                            </div>
                            <Skeleton tone="outline" className="h-[68px] w-full" />
                            <Skeleton tone="outline" className="h-[68px] w-full" />
                            <Skeleton tone="outline" className="h-[68px] w-full" />
                        </div>
                    ))}
                    <div className="flex justify-end border-t border-ink/10 px-6 py-4 sm:px-7">
                        <Skeleton tone="outline" className="h-[45px] w-[200px]" />
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-6 flex h-10 items-center border-b border-ink/10 pb-4">
                    <Skeleton className="h-[18px] w-24" />
                </div>
                <Skeleton tone="soft" className="mb-7 h-4 w-96 max-w-full" />
                <div className="border border-ink/10">
                    <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7">
                        <Skeleton tone="outline" className="h-[68px] w-full" />
                        <Skeleton tone="outline" className="h-[68px] w-full" />
                    </div>
                    <div className="flex justify-end border-t border-ink/10 px-6 py-4 sm:px-7">
                        <Skeleton tone="outline" className="h-[45px] w-[168px]" />
                    </div>
                </div>
            </div>
        </SkeletonGroup>
    );
}
