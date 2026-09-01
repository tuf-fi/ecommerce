import Image from "next/image";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { STAGGER } from "../ui/motion/constants";
import { ritualImages } from "../ui/images";

const rituals = [
    {
        eyebrow: "Ritual One",
        title: "The Glass Skin Routine",
        copy: "Five steps, applied in order — for skin that looks lit from underneath.",
    },
    {
        eyebrow: "Ritual Two",
        title: "Barrier First",
        copy: "Rebuild what stripping actively broke, before you treat anything else.",
    },
] as const;

export default function Moments(){
    return(
        <SectionContainer id="rituals">
            <SectionTitle num="03" title="Rituals" />

            <div className="grid grid-cols-2 gap-6">
                {rituals.map((ritual, index) => (
                    <RevealIn key={ritual.title} direction="bottom" delay={index * STAGGER}>
                        <a
                            href="#"
                            className="group relative isolate flex h-[440px] flex-col justify-end overflow-hidden border border-ink/10 p-9"
                        >
                            <Image
                                src={ritualImages[ritual.title]}
                                alt={ritual.title}
                                fill
                                sizes="(min-width: 1024px) 50vw, 100vw"
                                className="absolute inset-0 -z-10 object-cover transition duration-500 group-hover:scale-[1.04]"
                            />
                            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                            <span className="eyebrow mb-3 text-white/70">
                                {ritual.eyebrow}
                            </span>
                            <h3 className="mb-2 text-[clamp(22px,2.4vw,30px)] font-medium text-white">
                                {ritual.title}
                            </h3>
                            <p className="mb-5 max-w-[320px] text-[13.5px] leading-relaxed text-white/80">
                                {ritual.copy}
                            </p>
                            <span className="inline-flex w-fit items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-white underline decoration-white/40 underline-offset-4 group-hover:decoration-white">
                                Shop Now →
                            </span>
                        </a>
                    </RevealIn>
                ))}
            </div>
        </SectionContainer>
    )
}
