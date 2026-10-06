"use client";

import { SkeletonTable } from "@/components/ui/Skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BTN_ADD, BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL, ICON_BTN, ICON_BTN_DANGER, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import Toggle from "@/components/ui/Toggle";
import ListPanel from "@/components/admin/ListPanel";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Tooltip from "@/components/ui/Tooltip";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
import { AdminVoucher, createDiscountCode, deleteDiscountCode, listDiscountCodes, updateDiscountCode } from "@/library/api/adminData";
import { ApiError } from "@/library/api/client";

const msg = (err: unknown) => (err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");

export default function DiscountCodesPage() {
    const [codes, setCodes] = useState<AdminVoucher[] | null>(null);
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [percentOff, setPercentOff] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [forEmail, setForEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<AdminVoucher | null>(null);
    const [deleting, setDeleting] = useState<AdminVoucher | null>(null);

    useEffect(() => {
        let alive = true;
        listDiscountCodes()
            .then((c) => alive && setCodes(c))
            .catch((err) => {
                if (alive) {
                    setCodes([]);
                    toast.error(msg(err));
                }
            });
        return () => {
            alive = false;
        };
    }, []);

    function openAdd() {
        setEditing(null);
        setCode("");
        setDescription("");
        setPercentOff("");
        setExpiresAt("");
        setMaxUses("");
        setForEmail("");
        setModalOpen(true);
    }

    function openEdit(v: AdminVoucher) {
        setEditing(v);
        setCode(v.code);
        setDescription(v.description);
        setPercentOff(String(v.percentOff ?? ""));
        setExpiresAt(v.expiresAt ?? "");
        setMaxUses(v.maxUses ? String(v.maxUses) : "");
        setForEmail(v.personalFor ?? "");
        setModalOpen(true);
    }

    async function save(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                const { voucher } = await updateDiscountCode(editing.id, {
                    description: description.trim(),
                    expiresAt: expiresAt || null,
                    maxUses: maxUses ? Number(maxUses) : null,
                });
                setCodes((c) => c?.map((x) => (x.id === voucher.id ? voucher : x)) ?? null);
                toast.success(`Code ${voucher.code} updated.`);
            } else {
                const { voucher } = await createDiscountCode({
                    code: code.trim(),
                    description: description.trim(),
                    percentOff: Number(percentOff),
                    expiresAt: expiresAt || null,
                    maxUses: maxUses ? Number(maxUses) : null,
                    forEmail: forEmail.trim() || null,
                });
                setCodes((c) => [voucher, ...(c ?? [])]);
                toast.success(`Code ${voucher.code} created.`);
            }
            setModalOpen(false);
        } catch (err) {
            toast.error(msg(err));
        } finally {
            setSaving(false);
        }
    }

    async function remove(v: AdminVoucher) {
        try {
            await deleteDiscountCode(v.id);
            setCodes((c) => c?.filter((x) => x.id !== v.id) ?? null);
            toast.success(`Code ${v.code} deleted.`);
        } catch (err) {
            toast.error(msg(err));
        }
    }

    async function toggle(v: AdminVoucher) {
        try {
            const { voucher } = await updateDiscountCode(v.id, { active: !v.active });
            setCodes((c) => c?.map((x) => (x.id === v.id ? voucher : x)) ?? null);
            toast.success(`${voucher.code} is now ${voucher.active ? "on" : "off"}.`);
        } catch (err) {
            toast.error(msg(err));
        }
    }

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <p className="max-w-[560px] text-[12.5px] leading-relaxed text-grey">
                    Percentage-off codes customers type at checkout. Each customer can use a code once. Turning a code off stops it working straight away.
                </p>
                <button onClick={openAdd} className={BTN_ADD}>
                    + Add Code
                </button>
            </div>

            {!codes ? (
                <SkeletonTable rows={6} cols={4} />
            ) : codes.length === 0 ? (
                <p className="text-[13px] text-grey">No codes yet.</p>
            ) : (
                <ListPanel minWidth={560} footer={<>Showing {codes.length} of {codes.length}</>}>
                    <thead>
                        <tr className={TABLE_HEAD_ROW}>
                            {["Code", "Off", "Used", "Last day", "For", "Active", ""].map((h, i) => (
                                <th key={i} scope="col" className={`${TABLE_TH} ${i === 5 ? "text-right" : ""}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {codes.map((v) => (
                            <tr key={v.id} className={v.active ? "" : "text-grey"}>
                                <td className={`${TABLE_TD} font-mono text-[12.5px] text-ink`}>{v.code}</td>
                                <td className={`${TABLE_TD} font-mono text-[12.5px]`}>{v.percentOff ?? "—"}%</td>
                                <td className={`${TABLE_TD} font-mono text-[12.5px]`}>{v.uses}{v.maxUses ? ` / ${v.maxUses}` : ""}</td>
                                <td className={`${TABLE_TD} font-mono text-[12.5px]`}>{v.expiresAt ?? "—"}</td>
                                <td className={`${TABLE_TD} text-[13px]`}>{v.personalFor ?? "Anyone"}</td>
                                <td className={TABLE_TD}>
                                    <div className="flex justify-end">
                                        <Toggle checked={v.active} onChange={() => toggle(v)} ariaLabel={`${v.code} is ${v.active ? "on" : "off"}`} />
                                    </div>
                                </td>
                                <td className={`${TABLE_TD} w-px`}>
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Tooltip label="Edit">
                                            <button onClick={() => openEdit(v)} aria-label={`Edit ${v.code}`} className={ICON_BTN}>
                                                <EditIcon />
                                            </button>
                                        </Tooltip>
                                        <Tooltip label="Delete">
                                            <button onClick={() => setDeleting(v)} aria-label={`Delete ${v.code}`} className={ICON_BTN_DANGER}>
                                                <TrashIcon />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </ListPanel>
            )}

            <Modal open={modalOpen} onClose={saving ? () => {} : () => setModalOpen(false)} maxWidth="max-w-[460px]" title={editing ? "Edit Code" : "Add Code"}>
                <form onSubmit={save}>
                    <div className="sticky top-0 z-10 border-b border-ink/10 bg-white px-8 py-5">
                        <h3 className="text-xl font-medium text-ink">{editing ? "Edit Code" : "Add Code"}</h3>
                    </div>
                    <div className="grid gap-4 px-8 pt-6 pb-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="dc-code" className={FIELD_LABEL}>Code</label>
                            <input id="dc-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER10" disabled={editing !== null} className={FIELD_INPUT} required />
                        </div>
                        <div>
                            <label htmlFor="dc-pct" className={FIELD_LABEL}>Percent off</label>
                            <input id="dc-pct" type="number" min={1} max={100} value={percentOff} onChange={(e) => setPercentOff(e.target.value)} disabled={editing !== null} className={FIELD_INPUT} required />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="dc-desc" className={FIELD_LABEL}>Description (customers see this)</label>
                            <input id="dc-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={120} placeholder="10% off your order" className={FIELD_INPUT} required />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="dc-for" className={FIELD_LABEL}>For (optional)</label>
                            <input id="dc-for" type="email" value={forEmail} onChange={(e) => setForEmail(e.target.value)} placeholder="Anyone — or enter one customer's email" disabled={editing !== null} className={FIELD_INPUT} />
                        </div>
                        <div>
                            <label htmlFor="dc-exp" className={FIELD_LABEL}>Last day (optional)</label>
                            <input id="dc-exp" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={FIELD_INPUT} />
                        </div>
                        <div>
                            <label htmlFor="dc-max" className={FIELD_LABEL}>Total uses (optional)</label>
                            <input id="dc-max" type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" className={FIELD_INPUT} />
                        </div>
                    </div>
                    <div className="border-t border-ink/10 px-8 py-5">
                        <button type="submit" disabled={saving} className={`${BTN_PRIMARY} w-full`}>
                            {saving ? (editing ? "Saving…" : "Creating…") : editing ? "Save changes" : "Create code"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                open={deleting !== null}
                title="Delete this code?"
                description={deleting ? `${deleting.code} will stop working right away. Past orders keep the code they used.` : undefined}
                confirmLabel="Delete"
                onConfirm={() => deleting && remove(deleting)}
                onClose={() => setDeleting(null)}
            />
        </div>
    );
}
