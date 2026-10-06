"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ContactContent, ContactInfo, useContent } from "@/library/content";
import Toggle from "@/components/ui/Toggle";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_INPUT_INVALID, FIELD_ERROR } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import ListPanel from "@/components/admin/ListPanel";

type ContactSection = "headline" | "details";

const CONTACT_SECTIONS: { key: ContactSection; label: string; caption: string }[] = [
    { key: "headline", label: "Section Headline", caption: "Heading above the form" },
    { key: "details", label: "Contact Details", caption: "Email, phone, address & hours" },
];

const HEADLINE_FIELDS: { key: keyof ContactContent; label: string }[] = [
    { key: "headline", label: "Headline (first line)" },
    { key: "accent", label: "Accent (highlighted line)" },
];

const CONTACT_DETAIL_FIELDS: { key: keyof ContactInfo; label: string }[] = [
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Phone" },
    { key: "addressLine1", label: "Address (line 1)" },
    { key: "addressLine2", label: "Address (line 2)" },
    { key: "hoursLine1", label: "Care Hours (line 1)" },
    { key: "hoursLine2", label: "Care Hours (line 2)" },
];

// Edits stage in local draft state, written to the shared content store only on handleSave — see PageContentEditor.tsx.
export default function ContactTab() {
    const { contact, updateContact, contactInfo, updateContactInfo, sectionVisibility, updateSectionVisibility } = useContent();
    const [section, setSection] = useState<ContactSection>("headline");
    const [contactDraft, setContactDraft] = useState<ContactContent>(contact);
    const [contactInfoDraft, setContactInfoDraft] = useState<ContactInfo>(contactInfo);
    const [errors, setErrors] = useState<{ headline?: string; accent?: string; email?: string }>({});

    const [saving, handleSave] = useAsyncAction(async () => {
        const nextErrors: { headline?: string; accent?: string; email?: string } = {};
        if (!contactDraft.headline.trim()) nextErrors.headline = "Headline is required.";
        if (!contactDraft.accent.trim()) nextErrors.accent = "Accent line is required.";
        const trimmedEmail = contactInfoDraft.email.trim();
        if (!trimmedEmail) nextErrors.email = "Email is required.";
        else if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) nextErrors.email = "Enter a valid email address.";
        if (nextErrors.headline || nextErrors.accent || nextErrors.email) {
            setErrors(nextErrors);
            toast.error("Fix the highlighted fields before saving.");
            return;
        }
        setErrors({});
        await wait();
        updateContact(contactDraft);
        updateContactInfo(contactInfoDraft);
        toast.success("Contact details saved.");
    });

    function handleContactChange(patch: Partial<ContactContent>) {
        setContactDraft((c) => ({ ...c, ...patch }));
        for (const key of Object.keys(patch) as (keyof ContactContent)[]) {
            if (errors[key as "headline" | "accent"]) setErrors((er) => ({ ...er, [key]: undefined }));
        }
    }

    function handleContactInfoChange(patch: Partial<ContactInfo>) {
        setContactInfoDraft((c) => ({ ...c, ...patch }));
        if (patch.email !== undefined && errors.email) setErrors((er) => ({ ...er, email: undefined }));
    }

    return (
        <div>
            {/* Contact's visibility toggle lives here rather than in the Pages
                list because Contact has its own tab — the same reasoning that
                puts the Journal toggle at the top of the Blog tab. */}
            <div className="mb-6 flex items-center justify-between gap-6 border border-ink/10 bg-white px-5 py-4">
                <div>
                    <div className="text-[13.5px] font-medium text-ink">Show the Contact section</div>
                    <p className="mt-0.5 text-[12px] text-grey">
                        Hiding it also removes its link from the site navigation. The details below still feed the footer either way.
                    </p>
                </div>
                <Toggle checked={sectionVisibility.contact} onChange={(v) => updateSectionVisibility("contact", v)} />
            </div>

            <div className="flex flex-col border border-ink/10 bg-white sm:flex-row sm:max-h-[70vh]">
                <div className="flex flex-none divide-x divide-ink/10 border-b border-ink/10 sm:w-64 sm:flex-col sm:divide-x-0 sm:divide-y sm:border-r sm:border-b-0">
                    {CONTACT_SECTIONS.map((s) => {
                        const active = section === s.key;
                        return (
                            <button
                                key={s.key}
                                onClick={() => setSection(s.key)}
                                className={`flex-1 px-5 py-4 text-left transition sm:flex-none ${active ? "bg-navy" : "hover:bg-off/60"}`}
                            >
                                <div className={`text-[13.5px] font-medium ${active ? "text-white" : "text-ink"}`}>{s.label}</div>
                                <div className={`mt-0.5 text-[11.5px] ${active ? "text-white/70" : "text-grey"}`}>{s.caption}</div>
                            </button>
                        );
                    })}
                </div>

                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-7">
                {section === "headline" && (
                <div>
                <div className="mb-5">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Section Headline</h3>
                    <p className="mt-1 text-[12px] text-grey">The two-line heading above the contact form.</p>
                </div>

                <ListPanel minWidth={480}>
                        <thead>
                            <tr className="bg-off/50">
                                {["Field", "Value"].map((h) => (
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
                            {HEADLINE_FIELDS.map((f) => {
                                const error = errors[f.key];
                                return (
                                    <tr key={f.key} className="transition hover:bg-off/40">
                                        <td className="border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{f.label}</td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <input
                                                value={contactDraft[f.key]}
                                                onChange={(e) => handleContactChange({ [f.key]: e.target.value } as Partial<ContactContent>)}
                                                aria-label={f.label}
                                                aria-invalid={error ? true : undefined}
                                                className={`${FIELD_INPUT} h-9 max-w-[420px] py-1.5 ${error ? FIELD_INPUT_INVALID : ""}`}
                                            />
                                            {error && <p className={FIELD_ERROR}>{error}</p>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                </ListPanel>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} disabled={saving} className={BTN_PRIMARY + " px-6 py-3"}>
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
                </div>
                )}

                {section === "details" && (
                <div>
                <div className="mb-5">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Contact Details</h3>
                    <p className="mt-1 text-[12px] text-grey">Read by both the Contact section and the footer — one copy, two places.</p>
                </div>

                <ListPanel minWidth={480}>
                        <thead>
                            <tr className="bg-off/50">
                                {["Field", "Value"].map((h) => (
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
                            {CONTACT_DETAIL_FIELDS.map((f) => {
                                const error = f.key === "email" ? errors.email : undefined;
                                return (
                                    <tr key={f.key} className="transition hover:bg-off/40">
                                        <td className="border-b border-ink/10 px-5 py-3 text-[13.5px] font-medium text-ink">{f.label}</td>
                                        <td className="border-b border-ink/10 px-5 py-3">
                                            <input
                                                value={contactInfoDraft[f.key]}
                                                onChange={(e) => handleContactInfoChange({ [f.key]: e.target.value } as Partial<ContactInfo>)}
                                                aria-label={f.label}
                                                aria-invalid={error ? true : undefined}
                                                className={`${FIELD_INPUT} h-9 max-w-[420px] py-1.5 ${error ? FIELD_INPUT_INVALID : ""}`}
                                            />
                                            {error && <p className={FIELD_ERROR}>{error}</p>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                </ListPanel>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} disabled={saving} className={BTN_PRIMARY + " px-6 py-3"}>
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
                </div>
                )}
                </div>
            </div>
        </div>
    );
}
