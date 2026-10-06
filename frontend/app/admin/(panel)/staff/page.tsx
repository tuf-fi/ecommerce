"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "@/library/adminStore";
import { StaffMember, StaffRole } from "@/library/admin/types";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import SearchField from "@/components/admin/SearchField";
import { Toolbar, ToolbarFilters, FilterField } from "@/components/admin/Toolbar";
import StatusBadge from "@/components/admin/StatusBadge";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import BulkActionBar from "@/components/admin/BulkActionBar";
import StaffModal from "@/components/admin/modals/StaffModal";
import type { StaffPatch } from "@/library/api/admin";
import StaffViewModal from "@/components/admin/modals/StaffViewModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER, FILTER_SELECT, BTN_BULK_DANGER } from "@/components/admin/formClasses";
import { useMounted } from "@/library/useMounted";
import Skeleton, { SkeletonGroup } from "@/components/ui/Skeleton";
import ListPanel from "@/components/admin/ListPanel";
import { EmptyStateRow } from "@/components/admin/EmptyState";
import { EditIcon, TrashIcon } from "@/components/admin/icons";

// "n" opens the Add Staff modal from anywhere, unless the user is typing in a field.
function isTypingTarget(el: EventTarget | null) {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

const PAGE_SIZE = 10;
const STAFF_ROLES: StaffRole[] = ["Administrator", "Staff"];
type SortKey = "name-asc" | "name-desc" | "role-admin-first" | "role-staff-first";

function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function StaffPage() {
    const { staff, addStaff, updateStaff, deleteStaff, bulkDeleteStaff, currentStaffId } = useAdminStore();
    const mounted = useMounted();
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<StaffRole | "All">("All");
    const [sort, setSort] = useState<SortKey>("name-asc");
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
        const sorted = [...list];
        switch (sort) {
            case "name-asc":
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name-desc":
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "role-admin-first":
                sorted.sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "Administrator" ? -1 : 1));
                break;
            case "role-staff-first":
                sorted.sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "Staff" ? -1 : 1));
                break;
        }
        return sorted;
    }, [staff, role, search, sort]);

    // Reset to page 1 on filter change; a render-time state adjustment, not an effect (see InventoryPage).
    const filterKey = `${role}|${search}|${sort}`;
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

    function handleSave(data: Omit<StaffMember, "id"> & { password?: string }, id?: number, changes?: StaffPatch) {
        return id ? updateStaff(id, changes ?? {}) : addStaff({ ...data, password: data.password ?? "" });
    }

    const administratorCount = staff.filter((s) => s.role === "Administrator").length;

    function requestDelete(s: StaffMember) {
        if (currentStaffId !== null && s.id === currentStaffId) {
            toast.error("You can't remove your own account while signed in.");
            return;
        }
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
            <Toolbar
                actions={
                    <button onClick={openAdd} className={BTN_ADD}>
                        + Add Staff
                    </button>
                }
                filters={
                    <ToolbarFilters>
                        <FilterField label="Search" className="min-w-[220px] flex-1">
                            <SearchField value={search} onChange={setSearch} placeholder="Search by name or email" className="w-full" />
                        </FilterField>
                        <FilterField label="Role" className="w-full flex-none sm:w-[150px]">
                            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole | "All")} className={`${FILTER_SELECT} w-full`}>
                                <option value="All">All roles</option>
                                {STAFF_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </FilterField>
                        <FilterField label="Sort by" className="w-full flex-none sm:w-[180px]">
                            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${FILTER_SELECT} w-full`}>
                                <option value="name-asc">Name (A–Z)</option>
                                <option value="name-desc">Name (Z–A)</option>
                                <option value="role-admin-first">Role (Admins First)</option>
                                <option value="role-staff-first">Role (Staff First)</option>
                            </select>
                        </FilterField>
                    </ToolbarFilters>
                }
            />

            <ListPanel minWidth={640} footer={<>Showing {filtered.length} of {staff.length}</>}>
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
                                {["Staff", "Role & Access", ""].map((h) => (
                                    <th key={h} scope="col" className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 && (
                                <EmptyStateRow colSpan={4} variant="filtered" message="No staff match this search." />
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
                                    {/* Email demoted to a caption under the name, not its own column — context, not a peer fact. */}
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
                                            <div className="min-w-0">
                                                <div className="text-[13.5px] font-medium text-ink">{s.name}</div>
                                                <div className="truncate text-[12px] text-grey">{s.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Role and Access are one decision (Access derives from Role=Administrator, see StaffModal). */}
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <StatusBadge label={s.role} tone={s.role === "Administrator" ? "neutral" : "success"} />
                                            <span className="text-[12.5px] text-grey">{s.access}</span>
                                        </div>
                                    </td>
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
                                                    <EditIcon />
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
                                                    <TrashIcon />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
            </ListPanel>

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <BulkActionBar count={selected.size} onClear={clearSelection}>
                <button onClick={() => setBulkDeleteOpen(true)} className={BTN_BULK_DANGER}>
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

function StaffSkeleton() {
    return (
        <SkeletonGroup>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-ink/10 pb-6">
                <div className="flex flex-1 flex-wrap items-end gap-4">
                    <Skeleton tone="outline" className="h-11 flex-1 min-w-[220px]" />
                    <Skeleton tone="outline" className="h-11 w-44" />
                    <Skeleton tone="outline" className="h-11 w-52" />
                </div>
                <div className="flex flex-none">
                    <Skeleton tone="outline" className="h-11 w-32" />
                </div>
            </div>

            <div className="overflow-hidden border border-ink/10 bg-white shadow-card">
                <div className="border-b border-ink/10 bg-off/50 px-5 py-3.5">
                    <Skeleton tone="soft" className="h-[10px] w-full" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 border-b border-ink/10 px-5 py-3 last:border-b-0">
                        <Skeleton tone="outline" className="h-4 w-4 flex-none" />
                        <Skeleton tone="faint" className="h-9 w-9 flex-none rounded-full" />
                        <div className="flex flex-1 flex-col gap-1.5">
                            <Skeleton className="h-[13.5px] w-28" />
                            <Skeleton tone="faint" className="h-3 w-40" />
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Skeleton tone="outline" className="h-[19px] w-24 rounded-pill" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Skeleton tone="outline" className="h-8 w-8 rounded-full" />
                            <Skeleton tone="outline" className="h-8 w-8 rounded-full" />
                        </div>
                    </div>
                ))}
                <div className="border-t border-ink/10 bg-off/50 px-5 py-2.5 text-right">
                    <Skeleton tone="soft" className="ml-auto h-[11px] w-28" />
                </div>
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
