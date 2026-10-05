"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsSection } from "@/components/admin/settings/SettingsSection";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL, FIELD_TEXTAREA } from "@/components/admin/formClasses";
import { useAdminStore } from "@/library/adminStore";
import { ApiError } from "@/library/api/client";
import { getPaymentInstructions, PaymentInstructions, PaymentMethodDetails, savePaymentInstructions } from "@/library/api/payments";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function PaymentDetailsSettingsPage() {
    const { currentStaffMember } = useAdminStore();
    const [draft, setDraft] = useState<PaymentInstructions | null>(null);
    const [saving, setSaving] = useState(false);
    const isAdministrator = currentStaffMember?.role === "Administrator";

    useEffect(() => {
        let alive = true;
        getPaymentInstructions().then((i) => alive && setDraft(i));
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

    if (!draft) {
        return (
            <SkeletonGroup>
                <Skeleton className="mb-6 h-[18px] w-40" />
                <Skeleton className="mb-3 h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </SkeletonGroup>
        );
    }

    return (
        <SettingsSection
            title="Payment Details"
            aside="Customers see these after placing an order, then upload a screenshot of their transfer for you to verify. Leave a method's number blank to hide it."
        >
            {!isAdministrator && (
                <p className="mb-5 border-l-2 border-pink-dark bg-pink-soft/40 px-3 py-2 text-[12.5px] text-ink">
                    Only administrators can change these. You can see what customers see.
                </p>
            )}
            <form onSubmit={save}>
                <div className="mb-6">
                    <label htmlFor="pay-intro" className={FIELD_LABEL}>Message to customers</label>
                    <textarea
                        id="pay-intro"
                        rows={2}
                        value={draft.intro}
                        onChange={(e) => setDraft({ ...draft, intro: e.target.value })}
                        disabled={!isAdministrator}
                        className={FIELD_TEXTAREA}
                    />
                </div>

                {draft.methods.map((m) => (
                    <fieldset key={m.id} className="mb-6 border border-ink/10 p-5" disabled={!isAdministrator}>
                        <legend className="px-2 text-[13px] font-medium text-ink">{m.label}</legend>
                        <div className="mb-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor={`pay-${m.id}-number`} className={FIELD_LABEL}>{m.id === "bank" ? "Bank & account number" : "Number"}</label>
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
                        </div>
                        <label htmlFor={`pay-${m.id}-notes`} className={FIELD_LABEL}>Extra note (optional)</label>
                        <input id={`pay-${m.id}-notes`} value={m.notes} onChange={(e) => setMethod(m.id, { notes: e.target.value })} className={FIELD_INPUT} />
                    </fieldset>
                ))}

                {isAdministrator && (
                    <button type="submit" disabled={saving} className={BTN_PRIMARY}>
                        {saving ? "Saving…" : "Save payment details"}
                    </button>
                )}
            </form>
        </SettingsSection>
    );
}
