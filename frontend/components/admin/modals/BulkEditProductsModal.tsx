"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

export default function BulkEditProductsModal({
    open,
    count,
    onClose,
    onApply,
}: {
    open: boolean;
    count: number;
    onClose: () => void;
    onApply: (adjust: { stockDelta?: number; setPrice?: number }) => void;
}) {
    const [stockDelta, setStockDelta] = useState("");
    const [setPriceValue, setSetPriceValue] = useState("");

    const [submitting, handleSubmit] = useAsyncAction(async () => {
        const adjust: { stockDelta?: number; setPrice?: number } = {};
        if (stockDelta.trim() && Number.isFinite(Number(stockDelta))) adjust.stockDelta = Number(stockDelta);
        if (setPriceValue.trim() && Number.isFinite(Number(setPriceValue))) adjust.setPrice = Number(setPriceValue);
        if (adjust.stockDelta === undefined && adjust.setPrice === undefined) {
            onClose();
            return;
        }
        await wait();
        onApply(adjust);
        setStockDelta("");
        setSetPriceValue("");
        onClose();
    });

    return (
        <Modal open={open} onClose={submitting ? () => {} : onClose} maxWidth="max-w-[420px]">
            <div className="p-8">
                <h3 className="mb-1 text-xl font-medium text-ink">
                    Bulk Edit {count} Product{count === 1 ? "" : "s"}
                </h3>
                <p className="mb-6 text-[12.5px] leading-relaxed text-grey">
                    Leave a field blank to leave it unchanged. Products with size variants are skipped —
                    edit those individually since price/stock is set per size.
                </p>
                <div className="mb-4">
                    <label htmlFor="bulk-stock-delta" className={FIELD_LABEL}>
                        Adjust Stock By
                    </label>
                    <input
                        id="bulk-stock-delta"
                        type="number"
                        value={stockDelta}
                        onChange={(e) => setStockDelta(e.target.value)}
                        placeholder="e.g. 10 or -5"
                        className={FIELD_INPUT}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="bulk-set-price" className={FIELD_LABEL}>
                        Set Price To (₱)
                    </label>
                    <input
                        id="bulk-set-price"
                        type="number"
                        min={0}
                        value={setPriceValue}
                        onChange={(e) => setSetPriceValue(e.target.value)}
                        placeholder="e.g. 599"
                        className={FIELD_INPUT}
                    />
                </div>
                <button onClick={handleSubmit} disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                    {submitting ? "Applying…" : "Apply"}
                </button>
            </div>
        </Modal>
    );
}
