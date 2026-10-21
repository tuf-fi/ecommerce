"use client";

import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";
import Modal, { ModalClose } from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { useMounted } from "@/library/useMounted";
import { formatPhone, normalizePhone, PHONE_ERROR } from "@/library/phone";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

export default function SavedAddressesPage() {
    const { addresses, addAddress, editAddress, removeAddress, setDefaultAddress, checkoutAddress, selectCheckoutAddress, showToast } =
        useStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [label, setLabel] = useState("");
    const [text, setText] = useState("");
    const [phone, setPhone] = useState("");
    const [removeId, setRemoveId] = useState<number | null>(null);
    const mounted = useMounted();

    function openAddModal() {
        setEditingId(null);
        setLabel("");
        setText("");
        setPhone("");
        setModalOpen(true);
    }

    function openEditModal(id: number) {
        const a = addresses.find((x) => x.id === id);
        if (!a) return;
        setEditingId(id);
        setLabel(a.label);
        setText(a.text);
        setPhone(a.phone ? formatPhone(a.phone) : "");
        setModalOpen(true);
    }

    const original = editingId !== null ? addresses.find((x) => x.id === editingId) : undefined;
    const addressDirty = original
        ? label !== original.label || text !== original.text || phone !== (original.phone ? formatPhone(original.phone) : "")
        : label.trim() !== "" || text.trim() !== "" || phone.trim() !== "";

    function closeModal() {
        setModalOpen(false);
        setEditingId(null);
        setLabel("");
        setText("");
        setPhone("");
    }

    const [saving, save] = useAsyncAction(async () => {
        if (!label.trim() || !text.trim() || !phone.trim()) {
            showToast("error", "Fill in all fields.");
            return;
        }
        const normalized = normalizePhone(phone);
        if (!normalized) {
            showToast("error", PHONE_ERROR);
            return;
        }
        await wait();
        if (editingId !== null) {
            editAddress(editingId, label.trim(), text.trim(), normalized);
            showToast("success", "Address updated.");
        } else {
            addAddress(label.trim(), text.trim(), normalized);
            showToast("success", "Address saved.");
        }
        closeModal();
    });

    function remove(id: number) {
        removeAddress(id);
        showToast("success", "Address removed.");
    }

    function makeDefault(id: number) {
        setDefaultAddress(id);
        showToast("success", "Default address updated.");
    }

    function chooseForCheckout(id: number) {
        selectCheckoutAddress(id);
        showToast("success", "Checkout address updated.");
    }

    // Default leads, checkout-selected comes next, rest keep original order.
    const sortedAddresses = [...addresses].sort((a, b) => {
        const rank = (x: (typeof addresses)[number]) => (x.isDefault ? 0 : checkoutAddress?.id === x.id ? 1 : 2);
        return rank(a) - rank(b);
    });

    if (!mounted) return <AddressesSkeleton />;

    return (
        <div>
            <PageHeading
                action={
                    <button
                        onClick={openAddModal}
                        className="ui-btn ui-btn-secondary ui-btn-sm"
                    >
                        + Add Address
                    </button>
                }
            >
                Saved Addresses
            </PageHeading>

            {addresses.length === 0 ? (
                <EmptyState title="No saved addresses" message="Add one to speed up checkout." />
            ) : (
                <ul className="border border-ink/10 bg-white">
                    {sortedAddresses.map((a, i) => {
                        const isCheckoutAddress = checkoutAddress?.id === a.id;
                        const linkBtn =
                            "text-meta font-semibold text-ink underline decoration-ink/25 underline-offset-4 transition hover:text-pink-btn hover:decoration-pink-btn focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2";

                        return (
                            <li
                                key={a.id}
                                className={`flex flex-col gap-3 border-b border-ink/10 px-5 py-4 last:border-b-0 sm:flex-row sm:items-start sm:gap-6 ${a.isDefault || isCheckoutAddress ? "bg-off shadow-[inset_2px_0_0_0_#0F2036]" : ""}`}
                            >
                                <span className="hidden w-6 flex-none pt-0.5 font-mono text-label text-grey sm:block">{String(i + 1).padStart(2, "0")}</span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                        <span className="text-body font-medium text-ink">{a.label}</span>
                                        {a.isDefault && (
                                            <span className="rounded-pill bg-navy px-2.5 py-0.5 font-mono text-label uppercase tracking-[.1em] text-white">Default</span>
                                        )}
                                        {isCheckoutAddress && (
                                            <span className="inline-flex items-center gap-1 rounded-pill bg-success/15 px-2.5 py-0.5 font-mono text-label uppercase tracking-[.1em] text-success-dark">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M20 6 9 17l-5-5" />
                                                </svg>
                                                Checkout
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-small leading-relaxed text-grey">{a.text}</p>
                                    {a.phone && <p className="mt-1 font-mono text-meta text-grey">{formatPhone(a.phone)}</p>}
                                </div>

                                <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-1 sm:justify-end sm:pt-0.5">
                                    {!isCheckoutAddress && (
                                        <button onClick={() => chooseForCheckout(a.id)} className={linkBtn}>
                                            Use for checkout
                                        </button>
                                    )}
                                    {!a.isDefault && (
                                        <button onClick={() => makeDefault(a.id)} className={linkBtn}>
                                            Set as default
                                        </button>
                                    )}
                                    <button onClick={() => openEditModal(a.id)} className={linkBtn}>
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setRemoveId(a.id)}
                                        className="text-meta font-semibold text-alert underline decoration-alert/30 underline-offset-4 transition hover:decoration-alert focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <Modal
                open={modalOpen}
                onClose={saving ? () => {} : closeModal}
                maxWidth="max-w-[460px]"
                heading={editingId !== null ? "Edit address" : "Add new address"}
                dirty={modalOpen && !saving && addressDirty}
                footer={
                    <>
                        <ModalClose asChild>
                            <button type="button" disabled={saving} className="ui-btn ui-btn-secondary">
                                Cancel
                            </button>
                        </ModalClose>
                        <button type="button" onClick={save} disabled={saving} className="ui-btn ui-btn-primary">
                            {saving ? "Saving…" : editingId !== null ? "Save changes" : "Save address"}
                        </button>
                    </>
                }
            >
                <div className="mb-3">
                    <label htmlFor="address-label" className="ui-label">Label</label>
                    <input id="address-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Home, Office" className="ui-input" />
                </div>
                <div>
                    <label htmlFor="address-text" className="ui-label">Full address</label>
                    <textarea id="address-text" value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Street, City, Province" className="ui-input resize-none" />
                </div>
                <div className="mt-3">
                    <label htmlFor="address-phone" className="ui-label">Contact number</label>
                    <input id="address-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567" className="ui-input" />
                    <p className="m-0 mt-1.5 text-meta text-grey">The courier calls this number. Use the recipient&apos;s if it&apos;s going to someone else.</p>
                </div>
            </Modal>

            <ConfirmModal
                open={removeId !== null}
                title="Remove this address?"
                description={
                    removeId !== null ? `"${addresses.find((a) => a.id === removeId)?.label}" will be removed from your saved addresses.` : undefined
                }
                onConfirm={() => removeId !== null && remove(removeId)}
                onClose={() => setRemoveId(null)}
            />
        </div>
    );
}

function AddressesSkeleton() {
    return (
        <div>
            <SkeletonGroup>
                <div className="mb-6 flex h-10 items-center justify-between border-b border-ink/10 pb-4">
                    <Skeleton className="h-[18px] w-40" />
                    <Skeleton tone="outline" className="h-9 w-36" />
                </div>

                <div className="border border-ink/10 bg-white">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-6 border-b border-ink/10 px-5 py-4 last:border-b-0">
                            <Skeleton tone="soft" className="hidden h-3 w-6 sm:block" />
                            <div className="min-w-0 flex-1">
                                <Skeleton className="h-[15px] w-24" />
                                <Skeleton tone="soft" className="mt-2.5 h-3 w-full max-w-[320px]" />
                            </div>
                            <Skeleton tone="soft" className="hidden h-3 w-40 sm:block" />
                        </div>
                    ))}
                </div>
            </SkeletonGroup>
        </div>
    );
}
