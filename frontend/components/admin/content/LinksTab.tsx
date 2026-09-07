"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FooterLinkGroup, SocialLinks, useContent } from "@/library/content";
import { FooterLinkItem, SiteNavLink } from "@/library/admin/types";
import { SECTION_LABELS } from "@/library/admin/sections";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import NavLinkModal from "@/components/admin/modals/NavLinkModal";
import FooterLinkModal from "@/components/admin/modals/FooterLinkModal";
import Toggle from "@/components/ui/Toggle";
import { BTN_ADD, BTN_PRIMARY, FIELD_INPUT, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

function EditIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            <path d="M18 7l-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
            <path d="M10 11v6M14 11v6" />
        </svg>
    );
}

function BlockHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
    return (
        <div className="mb-5 flex items-end justify-between gap-6">
            <div>
                <h3 className="m-0 text-[15px] font-medium text-ink">{title}</h3>
                <p className="mt-1 max-w-[560px] text-[12px] text-grey">{description}</p>
            </div>
            {action}
        </div>
    );
}

// Primary navigation, the footer's two link columns, and the three social
// URLs — everything on the site that's a link to somewhere else, on one page.
export default function LinksTab() {
    const {
        navLinks,
        addNavLink,
        updateNavLink,
        deleteNavLink,
        moveNavLink,
        footerShopLinks,
        footerCompanyLinks,
        addFooterLink,
        updateFooterLink,
        deleteFooterLink,
        socialLinks,
        updateSocialLinks,
    } = useContent();

    const [navEditing, setNavEditing] = useState<SiteNavLink | null>(null);
    const [navModalOpen, setNavModalOpen] = useState(false);
    const [navDeleteId, setNavDeleteId] = useState<number | null>(null);
    const navDeleting = navLinks.find((n) => n.id === navDeleteId) ?? null;

    const [footerModal, setFooterModal] = useState<{ group: FooterLinkGroup; link: FooterLinkItem | null } | null>(null);
    const [footerDelete, setFooterDelete] = useState<{ group: FooterLinkGroup; link: FooterLinkItem } | null>(null);

    // Staged in local draft state and only written to the shared content
    // store (which the live Contact section and Footer both read) inside
    // handleSaveSocial — see PageContentEditor.tsx for the reference pattern.
    // No live preview pane on this tab, so nothing else needs to thread the
    // draft through.
    const [socialDraft, setSocialDraft] = useState<SocialLinks>(socialLinks);

    function handleSocialChange(patch: Partial<SocialLinks>) {
        setSocialDraft((s) => ({ ...s, ...patch }));
    }

    const [savingSocial, handleSaveSocial] = useAsyncAction(async () => {
        await wait();
        updateSocialLinks(socialDraft);
        toast.success("Social links saved.");
    });

    function handleNavSave(data: Omit<SiteNavLink, "id">, id?: number) {
        if (id) updateNavLink(id, data);
        else addNavLink(data);
    }

    const footerGroups: { group: FooterLinkGroup; heading: string; links: FooterLinkItem[] }[] = [
        { group: "shop", heading: "Shop", links: footerShopLinks },
        { group: "company", heading: "Company", links: footerCompanyLinks },
    ];

    return (
        <div className="space-y-12">
            <section>
                <BlockHeading
                    title="Primary Navigation"
                    description={`The links in the site header, in order. "Home" isn't listed — it scrolls to the top rather than to a section, so there's nothing to edit.`}
                    action={
                        <button
                            onClick={() => {
                                setNavEditing(null);
                                setNavModalOpen(true);
                            }}
                            className={`flex-none ${BTN_ADD}`}
                        >
                            + Add Link
                        </button>
                    }
                />

                <div className="overflow-hidden border border-ink/10 bg-white">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-off/50">
                                {["Order", "Label", "Section", "Placement", ""].map((h) => (
                                    <th
                                        key={h}
                                        scope="col"
                                        className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[10px] tracking-[.12em] text-grey uppercase"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {navLinks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center text-[13px] text-grey">
                                        No navigation links yet.
                                    </td>
                                </tr>
                            )}
                            {navLinks.map((link, i) => (
                                <tr key={link.id} className="transition hover:bg-off/40">
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <div className="flex flex-col gap-0.5 text-grey">
                                            <button
                                                disabled={i === 0}
                                                onClick={() => moveNavLink(link.id, "up")}
                                                aria-label="Move up"
                                                className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M18 15l-6-6-6 6" />
                                                </svg>
                                            </button>
                                            <button
                                                disabled={i === navLinks.length - 1}
                                                onClick={() => moveNavLink(link.id, "down")}
                                                aria-label="Move down"
                                                className="flex h-4 w-4 items-center justify-center hover:text-ink disabled:opacity-25"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{link.label}</td>
                                    <td className="border-b border-ink/10 px-5 py-3 text-[13px] text-grey">{SECTION_LABELS[link.section]}</td>
                                    <td className="border-b border-ink/10 px-5 py-3 font-mono text-[11.5px] text-grey">
                                        {link.group === "more" ? "More dropdown" : "Main row"}
                                    </td>
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Tooltip label="Edit">
                                                <button
                                                    onClick={() => {
                                                        setNavEditing(link);
                                                        setNavModalOpen(true);
                                                    }}
                                                    aria-label="Edit link"
                                                    className={ICON_BTN}
                                                >
                                                    <EditIcon />
                                                </button>
                                            </Tooltip>
                                            <Tooltip label="Remove">
                                                <button onClick={() => setNavDeleteId(link.id)} aria-label="Remove link" className={ICON_BTN_DANGER}>
                                                    <TrashIcon />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <BlockHeading
                    title="Footer Links"
                    description="The two link columns in the footer. Unlike the header, these can point anywhere — a route, a homepage anchor, or an external URL."
                />

                <div className="grid grid-cols-2 gap-6">
                    {footerGroups.map(({ group, heading, links }) => (
                        <div key={group} className="border border-ink/10 bg-white">
                            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
                                <span className="font-mono text-[10px] tracking-[.14em] text-grey uppercase">{heading}</span>
                                <button
                                    onClick={() => setFooterModal({ group, link: null })}
                                    className="text-[12px] font-semibold text-pink-dark transition hover:text-pink-btn-hover"
                                >
                                    + Add
                                </button>
                            </div>
                            <ul className="divide-y divide-ink/10">
                                {links.length === 0 && <li className="px-5 py-10 text-center text-[13px] text-grey">No links yet.</li>}
                                {links.map((link) => (
                                    <li key={link.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-off/40">
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[13.5px] font-medium text-ink">{link.label}</div>
                                            <div className="truncate font-mono text-[11.5px] text-grey">{link.href}</div>
                                        </div>
                                        <Tooltip label="Edit">
                                            <button onClick={() => setFooterModal({ group, link })} aria-label="Edit link" className={ICON_BTN}>
                                                <EditIcon />
                                            </button>
                                        </Tooltip>
                                        <Tooltip label="Remove">
                                            <button onClick={() => setFooterDelete({ group, link })} aria-label="Remove link" className={ICON_BTN_DANGER}>
                                                <TrashIcon />
                                            </button>
                                        </Tooltip>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                {/* Fixed to five: each icon is a hand-drawn inline SVG in
                    Contact.tsx/Footer.tsx, so a sixth network would have
                    nothing to render. */}
                <BlockHeading
                    title="Social Links"
                    description="Where the five social icons in the footer and the Contact section point. Toggle a platform off to hide its icon from the site; leave a field as # to keep it inert while still shown."
                />

                <div className="border border-ink/10 bg-white px-7 pt-6 pb-7">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <label htmlFor="social-instagram-url" className="font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Instagram</label>
                                <Toggle
                                    checked={socialDraft.instagramEnabled}
                                    onChange={(v) => handleSocialChange({ instagramEnabled: v })}
                                />
                            </div>
                            <input
                                id="social-instagram-url"
                                value={socialDraft.instagramUrl}
                                onChange={(e) => handleSocialChange({ instagramUrl: e.target.value })}
                                className={FIELD_INPUT}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <label htmlFor="social-tiktok-url" className="font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">TikTok</label>
                                <Toggle
                                    checked={socialDraft.tiktokEnabled}
                                    onChange={(v) => handleSocialChange({ tiktokEnabled: v })}
                                />
                            </div>
                            <input
                                id="social-tiktok-url"
                                value={socialDraft.tiktokUrl}
                                onChange={(e) => handleSocialChange({ tiktokUrl: e.target.value })}
                                className={FIELD_INPUT}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <label htmlFor="social-pinterest-url" className="font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Pinterest</label>
                                <Toggle
                                    checked={socialDraft.pinterestEnabled}
                                    onChange={(v) => handleSocialChange({ pinterestEnabled: v })}
                                />
                            </div>
                            <input
                                id="social-pinterest-url"
                                value={socialDraft.pinterestUrl}
                                onChange={(e) => handleSocialChange({ pinterestUrl: e.target.value })}
                                className={FIELD_INPUT}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <label htmlFor="social-facebook-url" className="font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">Facebook</label>
                                <Toggle
                                    checked={socialDraft.facebookEnabled}
                                    onChange={(v) => handleSocialChange({ facebookEnabled: v })}
                                />
                            </div>
                            <input
                                id="social-facebook-url"
                                value={socialDraft.facebookUrl}
                                onChange={(e) => handleSocialChange({ facebookUrl: e.target.value })}
                                className={FIELD_INPUT}
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <label htmlFor="social-x-url" className="font-mono text-[10.5px] uppercase tracking-[.14em] text-grey">X</label>
                                <Toggle checked={socialDraft.xEnabled} onChange={(v) => handleSocialChange({ xEnabled: v })} />
                            </div>
                            <input
                                id="social-x-url"
                                value={socialDraft.xUrl}
                                onChange={(e) => handleSocialChange({ xUrl: e.target.value })}
                                className={FIELD_INPUT}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveSocial} disabled={savingSocial} className={BTN_PRIMARY + " px-6 py-3"}>
                        {savingSocial ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </section>

            {navModalOpen && <NavLinkModal link={navEditing} onClose={() => setNavModalOpen(false)} onSave={handleNavSave} />}

            {footerModal && (
                <FooterLinkModal
                    group={footerModal.group}
                    link={footerModal.link}
                    onClose={() => setFooterModal(null)}
                    onSave={(data, id) => {
                        if (id) updateFooterLink(footerModal.group, id, data);
                        else addFooterLink(footerModal.group, data);
                    }}
                />
            )}

            <ConfirmModal
                open={navDeleteId !== null}
                title="Remove this navigation link?"
                description={navDeleting ? `"${navDeleting.label}" will no longer appear in the site header.` : undefined}
                onConfirm={() => navDeleteId !== null && deleteNavLink(navDeleteId)}
                onClose={() => setNavDeleteId(null)}
            />

            <ConfirmModal
                open={footerDelete !== null}
                title="Remove this footer link?"
                description={footerDelete ? `"${footerDelete.link.label}" will no longer appear in the footer.` : undefined}
                onConfirm={() => footerDelete && deleteFooterLink(footerDelete.group, footerDelete.link.id)}
                onClose={() => setFooterDelete(null)}
            />
        </div>
    );
}
