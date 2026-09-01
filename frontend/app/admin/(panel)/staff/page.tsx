"use client";

import { useMemo, useState } from "react";
import { useAdminStore } from "@/library/adminStore";
import { StaffMember, StaffRole } from "@/library/admin/types";
import { useScrollTopOnChange } from "@/library/useScrollTopOnChange";
import SearchField from "@/components/admin/SearchField";
import StatusBadge from "@/components/admin/StatusBadge";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import StaffModal from "@/components/admin/modals/StaffModal";
import StaffViewModal from "@/components/admin/modals/StaffViewModal";
import { BTN_ADD, ICON_BTN, ICON_BTN_DANGER, FILTER_SELECT } from "@/components/admin/formClasses";

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
    const { staff, addStaff, updateStaff, deleteStaff } = useAdminStore();
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<StaffRole | "All">("All");
    const [page, setPage] = useState(1);
    const [viewing, setViewing] = useState<StaffMember | null>(null);
    const [editing, setEditing] = useState<StaffMember | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

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
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    useScrollTopOnChange(currentPage);

    function openAdd() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(s: StaffMember) {
        setEditing(s);
        setModalOpen(true);
    }

    function handleSave(data: Omit<StaffMember, "id">, id?: number) {
        if (id) updateStaff(id, data);
        else addStaff(data);
    }

    const deletingStaff = staff.find((s) => s.id === deleteId) ?? null;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
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
                <table className="w-full border-collapse">
                    <thead>
                            <tr className="bg-off/50">
                                {["Name", "Email", "Role", "Access", ""].map((h) => (
                                    <th key={h} className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center text-[13px] text-grey">
                                        No staff match this search.
                                    </td>
                                </tr>
                            )}
                            {paged.map((s) => (
                                <tr key={s.id} onClick={() => setViewing(s)} className="cursor-pointer transition hover:bg-off/40">
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
                                                        setDeleteId(s.id);
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

            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

            <StaffViewModal open={viewing !== null} staff={viewing} onClose={() => setViewing(null)} />

            {modalOpen && <StaffModal staff={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}

            <ConfirmModal
                open={deleteId !== null}
                title="Remove this staff account?"
                description={deletingStaff ? `"${deletingStaff.name}" will lose access to the admin panel.` : undefined}
                onConfirm={() => deleteId !== null && deleteStaff(deleteId)}
                onClose={() => setDeleteId(null)}
            />
        </div>
    );
}
