"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "@/library/adminStore";
import { StaffMember, StaffRole } from "@/library/admin/types";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import SearchField from "@/components/admin/SearchField";
import StatusBadge from "@/components/admin/StatusBadge";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import BulkActionBar from "@/components/admin/BulkActionBar";
import StaffModal from "@/components/admin/modals/StaffModal";
import StaffViewModal from "@/components/admin/modals/StaffViewModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER, FILTER_SELECT } from "@/components/admin/formClasses";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";

// "n" jumps straight to the Add Staff modal from anywhere on the page (unless
// the user is already typing in some field) — mirrors the guard SearchField
// uses for its own "/" shortcut.
function isTypingTarget(el: EventTarget | null) {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

const PAGE_SIZE = 10;
const STAFF_ROLES: StaffRole[] = ["Administrator", "Staff"];

function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function StaffPage() {
    const { staff, addStaff, updateStaff, deleteStaff, bulkDeleteStaff } = useAdminStore();
    const mounted = useMounted();
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<StaffRole | "All">("All");
    const [page, setPage] = useState(1);
    const [viewing, setViewing] = useState<StaffMember | null>(null);
    const [editing, setEditing] = useState<StaffMember | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const filtered = useMemo(() => {
        let list = staff;
        if (role !== "All") list = list.filter((s) => s.role === role);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
        }
        return list;
    }, [staff, role, search]);

    // Reset to page 1 whenever the filter set changes — a render-time state
    // adjustment rather than an effect (see InventoryPage for the pattern).
    const filterKey = `${role}|${search}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (filterKey !== prevFilterKey) {
        setPrevFilterKey(filterKey);
        setPage(1);
        if (selected.size > 0) setSelected(new Set());
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    useScrollTopOnChange(currentPage);

    function openAdd() {
        setEditing(null);
        setModalOpen(true);
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
            if (isTypingTarget(document.activeElement)) return;
            e.preventDefault();
            openAdd();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    const allOnPageSelected = paged.length > 0 && paged.every((s) => selected.has(s.id));
    function toggleRow(id: number) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }
    function toggleAllOnPage() {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allOnPageSelected) paged.forEach((s) => next.delete(s.id));
            else paged.forEach((s) => next.add(s.id));
            return next;
        });
    }
    function clearSelection() {
        setSelected(new Set());
    }

    function openEdit(s: StaffMember) {
        setEditing(s);
        setModalOpen(true);
    }

    function handleSave(data: Omit<StaffMember, "id">, id?: number) {
        if (id) updateStaff(id, data);
        else addStaff(data);
    }

    // NOTE: this codebase's admin auth is a placeholder (see adminStore.tsx —
    // login accepts any email/password and derives `adminName` from whatever
    // was typed, with no link back to a specific StaffMember record), so
    // there's no reliable "this is my own account" identity to guard against
    // self-deletion here. Only the last-Administrator guard is enforced.
    const administratorCount = staff.filter((s) => s.role === "Administrator").length;

    function requestDelete(s: StaffMember) {
        if (s.role === "Administrator" && administratorCount <= 1) {
            toast.error(`"${s.name}" is the last Administrator — promote another staff member before removing this account.`);
            return;
        }
        setDeleteId(s.id);
    }

    const deletingStaff = staff.find((s) => s.id === deleteId) ?? null;

    if (!mounted) return <StaffSkeleton />;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <SearchField value={search} onChange={setSearch} placeholder="Search by name or email" />
                    <select value={role} onChange={(e) => setRole(e.target.value as StaffRole | "All")} className={FILTER_SELECT}>
                        <option value="All">Role: All</option>
                        {STAFF_ROLES.map((r) => (
                            <option key={r} value={r}>
                                Role: {r}
                            </option>
                        ))}
                    </select>
                </div>
                <button onClick={openAdd} className={`flex-none ${BTN_ADD}`}>
                    + Add Staff
                </button>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                            <tr className="bg-off/50">
                                <th scope="col" className="w-11 border-b border-ink/10 px-5 py-3.5">
                                    <input
                                        type="checkbox"
                                        checked={allOnPageSelected}
                                        onChange={toggleAllOnPage}
                                        aria-label="Select all staff on this page"
                                        className="h-4 w-4 accent-pink-btn"
                                    />
                                </th>
                                {["Name", "Email", "Role", "Access", ""].map((h) => (
                                    <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center text-[13px] text-grey">
                                        No staff match this search.
                                    </td>
                                </tr>
                            )}
                            {paged.map((s) => (
                                <tr
                                    key={s.id}
                                    onClick={() => setViewing(s)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`View ${s.name}`}
                                    onKeyDown={(e) => {
                                        if ((e.key === "Enter" || e.key === " ") && !(e.target instanceof HTMLInputElement)) {
                                            e.preventDefault();
                                            setViewing(s);
                                        }
                                    }}
                                    className="cursor-pointer transition hover:bg-off/40"
                                >
                                    <td className="border-b border-ink/10 px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selected.has(s.id)}
                                            onChange={() => toggleRow(s.id)}
                                            aria-label={`Select ${s.name}`}
                                            className="h-4 w-4 accent-pink-btn"
                                        />
                                    </td>
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-blue-soft font-mono text-[11px] text-ink">
                                                {s.photo ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={s.photo} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    initials(s.name)
                                                )}
                                            </span>
                                            <span className="text-[13.5px] font-medium text-ink">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="border-b border-ink/10 px-5 py-3 text-[13px] text-ink">{s.email}</td>
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <StatusBadge label={s.role} tone={s.role === "Administrator" ? "neutral" : "success"} />
                                    </td>
                                    <td className="border-b border-ink/10 px-5 py-3 text-[12.5px] text-grey">{s.access}</td>
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Tooltip label="Edit">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEdit(s);
                                                    }}
                                                    aria-label="Edit staff"
                                                    className={ICON_BTN}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                        <path d="M12 20h9" />
                                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
                                                    </svg>
                                                </button>
                                            </Tooltip>
                                            <Tooltip label="Remove">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        requestDelete(s);
                                                    }}
                                                    aria-label="Remove staff"
                                                    className={ICON_BTN_DANGER}
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
              </div>
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <BulkActionBar count={selected.size} onClear={clearSelection}>
                <button
                    onClick={() => setBulkDeleteOpen(true)}
                    className="flex h-9 items-center border border-white/40 px-3.5 text-[12px] font-semibold text-white transition hover:border-alert hover:bg-alert"
                >
                    Delete selected
                </button>
            </BulkActionBar>

            <StaffViewModal open={viewing !== null} staff={viewing} onClose={() => setViewing(null)} />

            {modalOpen && <StaffModal staff={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this staff account?"
                description={deletingStaff ? `"${deletingStaff.name}" will lose access to the admin panel.` : undefined}
                onConfirm={() => deleteId !== null && deleteStaff(deleteId)}
                onClose={() => setDeleteId(null)}
            />

            <ConfirmModal
                open={bulkDeleteOpen}
                title="Remove these staff accounts?"
                description={`${selected.size} staff account${selected.size === 1 ? "" : "s"} will be reviewed for removal. Any account that is the last remaining Administrator will be kept.`}
                onConfirm={() => {
                    bulkDeleteStaff(Array.from(selected));
                    clearSelection();
                }}
                onClose={() => setBulkDeleteOpen(false)}
            />
        </div>
    );
}

// Mirrors the populated staff page — search/role toolbar with the Add Staff
// button, and the staff table with pagination.
function StaffSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    <Skeleton tone="outline" className="h-11 w-64" />
                    <Skeleton tone="outline" className="h-11 w-40" />
                </div>
                <Skeleton tone="outline" className="h-11 w-32" />
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white">
                <div className="border-b border-ink/10 bg-off/50 px-5 py-3.5">
                    <Skeleton tone="soft" className="h-[10px] w-full" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 border-b border-ink/10 px-5 py-3 last:border-b-0">
                        <Skeleton tone="outline" className="h-4 w-4 flex-none" />
                        <Skeleton tone="faint" className="h-9 w-9 flex-none rounded-full" />
                        <Skeleton className="h-[13.5px] w-28" />
                        <Skeleton className="h-[13px] w-40" />
                        <Skeleton tone="outline" className="h-[19px] w-24 rounded-pill" />
                        <Skeleton className="h-3 w-24" />
                        <div className="flex items-center gap-1.5">
                            <Skeleton tone="outline" className="h-8 w-8 rounded-full" />
                            <Skeleton tone="outline" className="h-8 w-8 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center gap-1.5">
                <Skeleton tone="outline" className="h-8 w-20" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-8" />
                <Skeleton tone="outline" className="h-8 w-16" />
            </div>
        </SkeletonGroup>
    );
}
