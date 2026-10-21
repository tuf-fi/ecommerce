"use client";

import { SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FIELD_ERROR, FIELD_INPUT_INVALID, focusFirstInvalid, BTN_ADD, FIELD_INPUT, FIELD_LABEL, FILTER_SELECT, ICON_BTN, ICON_BTN_DANGER, TABLE_HEAD_ROW, TABLE_TD, TABLE_TH } from "@/components/admin/formClasses";
import Toggle from "@/components/ui/Toggle";
import ListPanel from "@/components/admin/ListPanel";
import Pagination from "@/components/ui/Pagination";
import { FilterField, Toolbar, ToolbarFilters } from "@/components/admin/Toolbar";
import SearchField from "@/components/admin/SearchField";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Tooltip from "@/components/ui/Tooltip";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
import { AdminVoucher, createDiscountCode, deleteDiscountCode, listDiscountCodes, updateDiscountCode } from "@/library/api/adminData";
import { ApiError } from "@/library/api/client";

type CodeStatus = "all" | "active" | "off" | "expired" | "used-up";
type CodeSort = "newest" | "most-used" | "last-day";

const today = () => new Date().toISOString().slice(0, 10);
const isExpired = (v: AdminVoucher) => !!v.expiresAt && v.expiresAt < today();
const isUsedUp = (v: AdminVoucher) => !!v.maxUses && v.uses >= v.maxUses;

const PAGE_SIZE = 10;

const msg = (err: unknown) => (err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");

export default function DiscountCodesPage() {
    const [codes, setCodes] = useState<AdminVoucher[] | null>(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<CodeStatus>("all");
    const [sort, setSort] = useState<CodeSort>("newest");
    const [page, setPage] = useState(1);
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

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = codes ?? [];
        if (q) list = list.filter((v) => `${v.code} ${v.description} ${v.personalFor ?? ""}`.toLowerCase().includes(q));
        if (status === "active") list = list.filter((v) => v.active && !isExpired(v) && !isUsedUp(v));
        else if (status === "off") list = list.filter((v) => !v.active);
        else if (status === "expired") list = list.filter(isExpired);
        else if (status === "used-up") list = list.filter(isUsedUp);
        const sorted = [...list];
        if (sort === "most-used") sorted.sort((a, b) => b.uses - a.uses);
        else if (sort === "last-day") sorted.sort((a, b) => (a.expiresAt ?? "9999-12-31").localeCompare(b.expiresAt ?? "9999-12-31"));
        else sorted.sort((a, b) => b.id - a.id);
        return sorted;
    }, [codes, search, status, sort]);

    // Back to the first page whenever the filters change (a render-time adjustment, not an effect).
    const filterKey = `${search}|${status}|${sort}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
    }
    const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = shown.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    function openAdd() {
        setErrors({});
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
        setErrors({});
        setEditing(v);
        setCode(v.code);
        setDescription(v.description);
        setPercentOff(String(v.percentOff ?? ""));
        setExpiresAt(v.expiresAt ?? "");
        setMaxUses(v.maxUses ? String(v.maxUses) : "");
        setForEmail(v.personalFor ?? "");
        setModalOpen(true);
    }

    const codeDirty = editing
        ? description !== editing.description ||
          expiresAt !== (editing.expiresAt ?? "") ||
          maxUses !== (editing.maxUses ? String(editing.maxUses) : "")
        : [code, description, percentOff, expiresAt, maxUses, forEmail].some((v) => v.trim() !== "");

    const [errors, setErrors] = useState<{ code?: string; percentOff?: string; description?: string }>({});

    async function save(e: React.FormEvent) {
        e.preventDefault();
        const next: typeof errors = {};
        if (!editing) {
            if (!code.trim()) next.code = "Enter a code customers will type at checkout.";
            const pct = Number(percentOff);
            if (!Number.isInteger(pct) || pct < 1 || pct > 100) next.percentOff = "Enter a whole number from 1 to 100.";
        }
        if (!description.trim()) next.description = "Add a short description customers will see.";
        setErrors(next);
        if (Object.keys(next).length) {
            focusFirstInvalid("discount-code-form");
            return;
        }
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
            const message = msg(err);
            // A duplicate code belongs under the Code field, not in a toast.
            if (!editing && /exist|already|taken|duplicate/i.test(message)) {
                setErrors({ code: message });
                focusFirstInvalid("discount-code-form");
            } else {
                toast.error(message);
            }
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
                <p className="max-w-[560px] text-meta leading-relaxed text-grey">
                    Percentage-off codes customers type at checkout. Each customer can use a code once. Turning a code off stops it working straight away.
                </p>
                <button onClick={openAdd} className={`${BTN_ADD} ml-auto`}>
                    + Add Code
                </button>
            </div>

            {codes && codes.length > 0 && (
                <Toolbar
                    filters={
                        <ToolbarFilters>
                            <FilterField label="Search" className="min-w-[240px] flex-1">
                                <SearchField value={search} onChange={setSearch} placeholder="Search by code, description or email" className="w-full" />
                            </FilterField>
                            <FilterField label="Status" className="w-full flex-none sm:w-[160px]">
                                <select value={status} onChange={(e) => setStatus(e.target.value as CodeStatus)} className={`${FILTER_SELECT} w-full`}>
                                    <option value="all">All codes</option>
                                    <option value="active">Working now</option>
                                    <option value="off">Turned off</option>
                                    <option value="expired">Expired</option>
                                    <option value="used-up">Used up</option>
                                </select>
                            </FilterField>
                            <FilterField label="Sort by" className="w-full flex-none sm:w-[170px]">
                                <select value={sort} onChange={(e) => setSort(e.target.value as CodeSort)} className={`${FILTER_SELECT} w-full`}>
                                    <option value="newest">Newest</option>
                                    <option value="most-used">Most used</option>
                                    <option value="last-day">Ends soonest</option>
                                </select>
                            </FilterField>
                        </ToolbarFilters>
                    }
                />
            )}

            {!codes ? (
                <SkeletonTable rows={6} cols={6} />
            ) : codes.length === 0 ? (
                <EmptyState title="No codes yet" message="Add a code and customers can type it at checkout." />
            ) : shown.length === 0 ? (
                <EmptyState title="No matches" message="No codes match those filters." />
            ) : (
                <ListPanel minWidth={560} footer={<>Showing {paged.length} of {shown.length}</>}>
                    <thead>
                        <tr className={TABLE_HEAD_ROW}>
                            {["Code", "Off", "Used", "Last day", "For", "Active", ""].map((h, i) => (
                                <th key={i} scope="col" className={`${TABLE_TH} ${i === 5 ? "text-right" : ""}`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.map((v) => (
                            <tr key={v.id} className={v.active ? "" : "text-grey"}>
                                <td className={`${TABLE_TD} font-mono text-meta text-ink`}>{v.code}</td>
                                <td className={`${TABLE_TD} font-mono text-meta`}>{v.percentOff ?? "—"}%</td>
                                <td className={`${TABLE_TD} font-mono text-meta`}>{v.uses}{v.maxUses ? ` / ${v.maxUses}` : ""}</td>
                                <td className={`${TABLE_TD} font-mono text-meta`}>{v.expiresAt ?? "—"}</td>
                                <td className={`${TABLE_TD} text-small`}>{v.personalFor ?? "Anyone"}</td>
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
            {codes && shown.length > 0 && <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />}

            <Modal
                open={modalOpen}
                onClose={saving ? () => {} : () => setModalOpen(false)}
                maxWidth="max-w-[460px]"
                heading={editing ? "Edit code" : "Add code"}
                dirty={modalOpen && !saving && codeDirty}
                footer={
                    <button type="submit" form="discount-code-form" disabled={saving} className="ui-btn ui-btn-primary w-full sm:w-auto">
                        {saving ? (editing ? "Saving…" : "Creating…") : editing ? "Save changes" : "Create code"}
                    </button>
                }
            >
                <form id="discount-code-form" onSubmit={save} noValidate>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="dc-code" className={FIELD_LABEL}>Code</label>
                            <input id="dc-code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); if (errors.code) setErrors((er) => ({ ...er, code: undefined })); }} placeholder="SUMMER10" disabled={editing !== null} aria-invalid={errors.code ? true : undefined} aria-describedby={errors.code ? "dc-code-error" : editing ? "dc-locked" : undefined} className={`${FIELD_INPUT} ${errors.code ? FIELD_INPUT_INVALID : ""}`} required />
                            {errors.code && <p id="dc-code-error" role="alert" className={FIELD_ERROR}>{errors.code}</p>}
                            {editing && <p id="dc-locked" className="m-0 mt-1.5 text-label text-grey">Can&apos;t be changed after creation.</p>}
                        </div>
                        <div>
                            <label htmlFor="dc-pct" className={FIELD_LABEL}>Percent off</label>
                            <input id="dc-pct" type="number" min={1} max={100} value={percentOff} onChange={(e) => { setPercentOff(e.target.value); if (errors.percentOff) setErrors((er) => ({ ...er, percentOff: undefined })); }} disabled={editing !== null} aria-invalid={errors.percentOff ? true : undefined} aria-describedby={errors.percentOff ? "dc-pct-error" : editing ? "dc-locked" : undefined} className={`${FIELD_INPUT} ${errors.percentOff ? FIELD_INPUT_INVALID : ""}`} required />
                            {errors.percentOff && <p id="dc-pct-error" role="alert" className={FIELD_ERROR}>{errors.percentOff}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="dc-desc" className={FIELD_LABEL}>Description (customers see this)</label>
                            <input id="dc-desc" value={description} onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((er) => ({ ...er, description: undefined })); }} maxLength={120} placeholder="10% off your order" aria-invalid={errors.description ? true : undefined} aria-describedby={errors.description ? "dc-desc-error" : undefined} className={`${FIELD_INPUT} ${errors.description ? FIELD_INPUT_INVALID : ""}`} required />
                            {errors.description && <p id="dc-desc-error" role="alert" className={FIELD_ERROR}>{errors.description}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="dc-for" className={FIELD_LABEL}>For (optional)</label>
                            <input id="dc-for" type="email" value={forEmail} onChange={(e) => setForEmail(e.target.value)} placeholder="Anyone — or enter one customer's email" disabled={editing !== null} aria-describedby={editing ? "dc-locked" : undefined} className={FIELD_INPUT} />
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
