"use client";

import { useState } from "react";
import { useStore } from "@/library/store";
import PageHeading from "@/components/ui/PageHeading";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Tooltip from "@/components/ui/Tooltip";

export default function SavedAddressesPage() {
    const { addresses, addAddress, editAddress, removeAddress, setDefaultAddress, checkoutAddress, selectCheckoutAddress, showToast } =
        useStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [label, setLabel] = useState("");
    const [text, setText] = useState("");
    const [removeId, setRemoveId] = useState<number | null>(null);

    function openAddModal() {
        setEditingId(null);
        setLabel("");
        setText("");
        setModalOpen(true);
    }

    function openEditModal(id: number) {
        const a = addresses.find((x) => x.id === id);
        if (!a) return;
        setEditingId(id);
        setLabel(a.label);
        setText(a.text);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditingId(null);
        setLabel("");
        setText("");
    }

    function save() {
        if (!label.trim() || !text.trim()) {
            showToast("error", "Fill in both fields.");
            return;
        }
        if (editingId !== null) {
            editAddress(editingId, label.trim(), text.trim());
            showToast("success", "Address updated.");
        } else {
            addAddress(label.trim(), text.trim());
            showToast("success", "Address saved.");
        }
        closeModal();
    }

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

    // Default always leads; the checkout-selected address (if different) comes
    // right after; everything else keeps its original order.
    const sortedAddresses = [...addresses].sort((a, b) => {
        const rank = (x: (typeof addresses)[number]) => (x.isDefault ? 0 : checkoutAddress?.id === x.id ? 1 : 2);
        return rank(a) - rank(b);
    });

    return (
        <div>
            <PageHeading
                action={
                    <button
                        onClick={openAddModal}
                        className="border border-ink/15 px-5 py-2 text-[12.5px] font-semibold tracking-wide text-ink transition hover:bg-off/60"
                    >
                        + Add Address
                    </button>
                }
            >
                Saved Addresses
            </PageHeading>

            {addresses.length === 0 ? (
                <div className="flex flex-col items-center gap-4 border border-ink/10 py-16 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-off text-grey">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                    </span>
                    <p className="max-w-[280px] text-[13px] leading-relaxed text-grey">No saved addresses yet. Add one to speed up checkout.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {sortedAddresses.map((a) => {
                        const isCheckoutAddress = checkoutAddress?.id === a.id;

                        return (
                            <div
                                key={a.id}
                                className={`flex flex-col gap-4 border p-5 transition sm:flex-row sm:items-center ${
                                    isCheckoutAddress ? "border-pink-btn" : "border-ink/10"
                                }`}
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-4">
                                    <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${a.isDefault ? "bg-navy text-white" : "bg-off text-grey"}`}>
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[13.5px] font-medium text-ink">{a.label}</span>
                                            {a.isDefault && (
                                                <span className="rounded-pill bg-navy px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[.1em] text-white">
                                                    Default
                                                </span>
                                            )}
                                            {isCheckoutAddress && (
                                                <span className="rounded-pill border border-pink-btn px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[.1em] text-pink-btn">
                                                    Selected for Checkout
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 text-[12px] text-grey">{a.text}</div>
                                    </div>
                                </div>

                                <div className="flex flex-none flex-wrap items-center gap-2 sm:justify-end">
                                    {!isCheckoutAddress && (
                                        <button
                                            onClick={() => chooseForCheckout(a.id)}
                                            className="whitespace-nowrap border border-ink/15 px-3.5 py-1.5 text-[11px] font-semibold text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                                        >
                                            Use for Checkout
                                        </button>
                                    )}
                                    {!a.isDefault && (
                                        <button
                                            onClick={() => makeDefault(a.id)}
                                            className="whitespace-nowrap border border-ink/15 px-3.5 py-1.5 text-[11px] font-semibold text-ink transition hover:border-navy hover:bg-navy hover:text-white"
                                        >
                                            Set as Default
                                        </button>
                                    )}
                                    <Tooltip label="Edit">
                                        <button
                                            onClick={() => openEditModal(a.id)}
                                            aria-label="Edit address"
                                            className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-ink/10 text-ink transition hover:border-ink/25 hover:bg-off"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                            </svg>
                                        </button>
                                    </Tooltip>
                                    <Tooltip label="Remove">
                                        <button
                                            onClick={() => setRemoveId(a.id)}
                                            aria-label="Remove address"
                                            className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-ink/10 text-alert transition hover:border-alert/40 hover:bg-alert/5"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path d="M4 7h16" />
                                                <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                                <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
                                                <path d="M10 11v6M14 11v6" />
                                            </svg>
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal open={modalOpen} onClose={closeModal} maxWidth="max-w-[460px]">
                <div className="p-8">
                    <h3 className="mb-5 text-2xl font-medium text-ink">{editingId !== null ? "Edit Address" : "Add New Address"}</h3>

                    <div className="mb-3">
                        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Label</label>
                        <input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. Home, Office"
                            className="w-full border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30"
                        />
                    </div>
                    <div className="mb-5">
                        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Full Address</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={2}
                            placeholder="Street, City, Province"
                            className="w-full resize-none border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30"
                        />
                    </div>
                    <button
                        onClick={save}
                        className="inline-flex w-full items-center justify-center gap-2 bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {editingId !== null ? "Save Changes" : "Save Address"}
                    </button>
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
