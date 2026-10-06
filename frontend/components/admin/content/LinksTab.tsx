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
import { BTN_ADD, BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_ERROR, ICON_BTN, ICON_BTN_DANGER } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { isSafeHref } from "@/library/url-safety";
import ListPanel from "@/components/admin/ListPanel";
import { EmptyStateRow } from "@/components/admin/EmptyState";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
import ReorderButtons from "@/components/admin/ReorderButtons";

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

type LinksSection = "nav" | "footer" | "social";

const LINKS_SECTIONS: { key: LinksSection; label: string; caption: string }[] = [
    { key: "nav", label: "Primary Navigation", caption: "Header links" },
    { key: "footer", label: "Footer Links", caption: "Shop & Company columns" },
    { key: "social", label: "Social Links", caption: "Icons in footer & Contact" },
];

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

    const [section, setSection] = useState<LinksSection>("nav");

    const [navEditing, setNavEditing] = useState<SiteNavLink | null>(null);
    const [navModalOpen, setNavModalOpen] = useState(false);
    const [navDeleteId, setNavDeleteId] = useState<number | null>(null);
    const navDeleting = navLinks.find((n) => n.id === navDeleteId) ?? null;

    const [footerModal, setFooterModal] = useState<{ group: FooterLinkGroup; link: FooterLinkItem | null } | null>(null);
    const [footerDelete, setFooterDelete] = useState<{ group: FooterLinkGroup; link: FooterLinkItem } | null>(null);

    // Edits stage in local draft state, written to the shared content store only on handleSaveSocial — see PageContentEditor.tsx.
    const [socialDraft, setSocialDraft] = useState<SocialLinks>(socialLinks);
    const [socialErrors, setSocialErrors] = useState<Partial<Record<keyof SocialLinks, string>>>({});

    function handleSocialChange(patch: Partial<SocialLinks>) {
        setSocialDraft((s) => ({ ...s, ...patch }));
        for (const key of Object.keys(patch) as (keyof SocialLinks)[]) {
            if (socialErrors[key]) setSocialErrors((er) => ({ ...er, [key]: undefined }));
        }
    }

    // "" and "#" mean "not set / inert" and skip the scheme check; everything else must pass isSafeHref to block javascript: URIs.
    const SOCIAL_URL_KEYS: (keyof SocialLinks)[] = ["instagramUrl", "tiktokUrl", "pinterestUrl", "facebookUrl", "xUrl"];

    const [savingSocial, handleSaveSocial] = useAsyncAction(async () => {
        const nextErrors: Partial<Record<keyof SocialLinks, string>> = {};
        for (const key of SOCIAL_URL_KEYS) {
            const value = (socialDraft[key] as string).trim();
            if (value && value !== "#" && !isSafeHref(value)) {
                nextErrors[key] = "Enter a valid URL, mailto:, tel:, or leave as #.";
            }
        }
        if (Object.keys(nextErrors).length > 0) {
            setSocialErrors(nextErrors);
            toast.error("Fix the highlighted social links before saving.");
            return;
        }
        setSocialErrors({});
        await wait();
        updateSocialLinks(socialDraft);
        toast.success("Social links saved.");
    });

    function handleNavSave(data: Omit<SiteNavLink, "id">, id?: number) {
        if (id) updateNavLink(id, data);
        else addNavLink(data);
    }

    const footerGroups: { group: FooterLinkGroup; heading: string; links: FooterLinkItem[] }[] = [
        { group: "company", heading: "Company", links: footerCompanyLinks },
        { group: "shop", heading: "Shop", links: footerShopLinks },
    ];

    const SOCIAL_PLATFORMS: { label: string; enabledKey: keyof SocialLinks; urlKey: keyof SocialLinks }[] = [
        { label: "Instagram", enabledKey: "instagramEnabled", urlKey: "instagramUrl" },
        { label: "TikTok", enabledKey: "tiktokEnabled", urlKey: "tiktokUrl" },
        { label: "Pinterest", enabledKey: "pinterestEnabled", urlKey: "pinterestUrl" },
        { label: "Facebook", enabledKey: "facebookEnabled", urlKey: "facebookUrl" },
        { label: "X", enabledKey: "xEnabled", urlKey: "xUrl" },
    ];

    return (
        <>
        <div className="flex flex-col border border-ink/10 bg-white sm:flex-row sm:max-h-[70vh]">
            <div className="flex flex-none divide-x divide-ink/10 overflow-x-auto border-b border-ink/10 [scrollbar-width:none] sm:w-64 sm:overflow-visible [&::-webkit-scrollbar]:hidden sm:flex-col sm:divide-x-0 sm:divide-y sm:border-r sm:border-b-0">
                {LINKS_SECTIONS.map((s) => {
                    const active = section === s.key;
                    return (
                        <button
                            key={s.key}
                            onClick={() => setSection(s.key)}
                            className={`flex-none px-4 py-3.5 text-left whitespace-nowrap transition sm:px-5 sm:py-4 sm:whitespace-normal ${active ? "bg-navy" : "hover:bg-off/60"}`}
                        >
                            <div className={`text-[13.5px] font-medium ${active ? "text-white" : "text-ink"}`}>{s.label}</div>
                            <div className={`mt-0.5 hidden text-[11.5px] sm:block ${active ? "text-white/70" : "text-grey"}`}>{s.caption}</div>
                        </button>
                    );
                })}
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-7">
            {section === "nav" && (
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

                <ListPanel minWidth={480}>
                        <thead>
                            <tr className="bg-off/50">
                                {["Order", "Label", "Section", "Placement", ""].map((h) => (
                                    <th
                                        key={h}
                                        scope="col"
                                        className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {navLinks.length === 0 && (
                                <EmptyStateRow colSpan={5} variant="empty" message="No navigation links yet." />
                            )}
                            {navLinks.map((link, i) => (
                                <tr key={link.id} className="transition hover:bg-off/40">
                                    <td className="border-b border-ink/10 px-5 py-3">
                                        <ReorderButtons index={i} count={navLinks.length} onMove={(dir) => moveNavLink(link.id, dir)} />
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
                </ListPanel>
            </section>
            )}

            {section === "footer" && (
            <section>
                <BlockHeading
                    title="Footer Links"
                    description="The two link columns in the footer. Unlike the header, these can point anywhere — a route, a homepage anchor, or an external URL."
                />

                <div className="space-y-6">
                    {footerGroups.map(({ group, heading, links }) => (
                        <div key={group}>
                            <div className="mb-3 flex items-end justify-between gap-6">
                                <h4 className="m-0 text-[15px] font-medium text-ink">{heading}</h4>
                                <button onClick={() => setFooterModal({ group, link: null })} className={`flex-none ${BTN_ADD}`}>
                                    + Add
                                </button>
                            </div>
                            <ListPanel minWidth={400}>
                                    <thead>
                                        <tr className="bg-off/50">
                                            {["Label", "URL", ""].map((h) => (
                                                <th
                                                    key={h}
                                                    scope="col"
                                                    className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {links.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="border-b border-ink/10 px-5 py-10 text-center text-[13px] text-grey">
                                                    No links yet.
                                                </td>
                                            </tr>
                                        )}
                                        {links.map((link) => (
                                            <tr key={link.id} className="transition hover:bg-off/40">
                                                <td className="border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{link.label}</td>
                                                <td className="border-b border-ink/10 px-5 py-3 font-mono text-[11.5px] text-grey">{link.href}</td>
                                                <td className="border-b border-ink/10 px-5 py-3">
                                                    <div className="flex items-center justify-end gap-2">
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
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                            </ListPanel>
                        </div>
                    ))}
                </div>
            </section>
            )}

            {section === "social" && (
            <section>
                {/* Fixed to five: each icon is a hand-drawn inline SVG in
                    Contact.tsx/Footer.tsx, so a sixth network would have
                    nothing to render. */}
                <BlockHeading
                    title="Social Links"
                    description="Where the five social icons in the footer and the Contact section point. Toggle a platform off to hide its icon from the site; leave a field as # to keep it inert while still shown."
                />

                <ListPanel minWidth={480}>
                        <thead>
                            <tr className="bg-off/50">
                                {["Platform", "Enabled", "URL"].map((h) => (
                                    <th
                                        key={h}
                                        scope="col"
                                        className="border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SOCIAL_PLATFORMS.map((p) => {
                                const url = socialDraft[p.urlKey] as string;
                                const error = socialErrors[p.urlKey];
                                return (
                                    <tr key={p.urlKey} className="transition hover:bg-off/40">
                                        <td className="border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{p.label}</td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <Toggle
                                                checked={socialDraft[p.enabledKey] as boolean}
                                                onChange={(v) => handleSocialChange({ [p.enabledKey]: v } as Partial<SocialLinks>)}
                                            />
                                        </td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <input
                                                value={url}
                                                onChange={(e) => handleSocialChange({ [p.urlKey]: e.target.value } as Partial<SocialLinks>)}
                                                aria-label={`${p.label} URL`}
                                                aria-invalid={error ? true : undefined}
                                                className={`${FIELD_INPUT} h-9 max-w-[360px] py-1.5 ${error ? FIELD_INPUT_INVALID : ""}`}
                                            />
                                            {error && <p className={FIELD_ERROR}>{error}</p>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                </ListPanel>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveSocial} disabled={savingSocial} className={BTN_PRIMARY + " px-6 py-3"}>
                        {savingSocial ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </section>
            )}
            </div>
        </div>

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
        </>
    );
}
