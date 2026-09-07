"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ContactContent, ContactInfo, useContent } from "@/library/content";
import Toggle from "@/components/ui/Toggle";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";

// Edits to the section headline and contact details are staged in local
// draft state and only written to the shared content store (which the live
// customer-facing Contact section and Footer both read) inside handleSave —
// see PageContentEditor.tsx for the reference pattern. This tab has no live
// preview pane (unlike Hero/About/etc.), so there's no draft-threading
// concern here beyond deferring the writes themselves.
export default function ContactTab() {
    const { contact, updateContact, contactInfo, updateContactInfo, sectionVisibility, updateSectionVisibility } = useContent();
    const [contactDraft, setContactDraft] = useState<ContactContent>(contact);
    const [contactInfoDraft, setContactInfoDraft] = useState<ContactInfo>(contactInfo);

    const [saving, handleSave] = useAsyncAction(async () => {
        await wait();
        updateContact(contactDraft);
        updateContactInfo(contactInfoDraft);
        toast.success("Contact details saved.");
    });

    function handleContactChange(patch: Partial<ContactContent>) {
        setContactDraft((c) => ({ ...c, ...patch }));
    }

    function handleContactInfoChange(patch: Partial<ContactInfo>) {
        setContactInfoDraft((c) => ({ ...c, ...patch }));
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

            <div className="border border-ink/10 bg-white px-7 pt-6 pb-7">
                <div className="mb-5">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Section Headline</h3>
                    <p className="mt-1 text-[12px] text-grey">The two-line heading above the contact form.</p>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contact-headline" className={FIELD_LABEL}>Headline (first line)</label>
                        <input
                            id="contact-headline"
                            value={contactDraft.headline}
                            onChange={(e) => handleContactChange({ headline: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-accent" className={FIELD_LABEL}>Accent (highlighted line)</label>
                        <input
                            id="contact-accent"
                            value={contactDraft.accent}
                            onChange={(e) => handleContactChange({ accent: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                </div>

                <div className="mb-5 border-t border-ink/10 pt-7">
                    <h3 className="m-0 text-[15px] font-medium text-ink">Contact Details</h3>
                    <p className="mt-1 text-[12px] text-grey">Read by both the Contact section and the footer — one copy, two places.</p>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contact-email" className={FIELD_LABEL}>E-mail</label>
                        <input
                            id="contact-email"
                            value={contactInfoDraft.email}
                            onChange={(e) => handleContactInfoChange({ email: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-phone" className={FIELD_LABEL}>Phone</label>
                        <input
                            id="contact-phone"
                            value={contactInfoDraft.phone}
                            onChange={(e) => handleContactInfoChange({ phone: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                </div>

                {/* Two lines rather than one free-text field: both the section and
                    the footer render these with a hard line break between them. */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contact-address-1" className={FIELD_LABEL}>Address (line 1)</label>
                        <input
                            id="contact-address-1"
                            value={contactInfoDraft.addressLine1}
                            onChange={(e) => handleContactInfoChange({ addressLine1: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-address-2" className={FIELD_LABEL}>Address (line 2)</label>
                        <input
                            id="contact-address-2"
                            value={contactInfoDraft.addressLine2}
                            onChange={(e) => handleContactInfoChange({ addressLine2: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="contact-hours-1" className={FIELD_LABEL}>Care Hours (line 1)</label>
                        <input
                            id="contact-hours-1"
                            value={contactInfoDraft.hoursLine1}
                            onChange={(e) => handleContactInfoChange({ hoursLine1: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-hours-2" className={FIELD_LABEL}>Care Hours (line 2)</label>
                        <input
                            id="contact-hours-2"
                            value={contactInfoDraft.hoursLine2}
                            onChange={(e) => handleContactInfoChange({ hoursLine2: e.target.value })}
                            className={FIELD_INPUT}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={saving} className={BTN_PRIMARY + " px-6 py-3"}>
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
