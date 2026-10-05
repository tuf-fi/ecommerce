"use client";

import Modal from "@/components/ui/Modal";
import { ViewHeader, DetailBody, SectionLabel } from "@/components/admin/modals/ViewModalLayout";
import { Testimonial } from "@/library/admin/types";

function initials(name: string) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function TestimonialViewModal({
    open,
    testimonial,
    onClose,
}: {
    open: boolean;
    testimonial: Testimonial | null;
    onClose: () => void;
}) {
    if (!testimonial) return null;

    return (
        <Modal open={open} onClose={onClose} maxWidth="max-w-[420px]">
            <ViewHeader
                title={testimonial.name}
                caption={
                    <>
                        {testimonial.position}
                        {testimonial.company && ` · ${testimonial.company}`}
                    </>
                }
                thumbnail={
                    <div className="relative h-12 w-12 flex-none overflow-hidden rounded-full bg-blue-soft">
                        {testimonial.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={testimonial.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink/60">
                                {initials(testimonial.name)}
                            </span>
                        )}
                    </div>
                }
            />
            <DetailBody>
                <SectionLabel label="Message" />
                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink/85">{testimonial.message}</p>
            </DetailBody>
        </Modal>
    );
}
