import Image from "next/image";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { concernImages } from "../ui/images";

const concerns = ["Dryness", "Breakouts", "Dullness", "Fine Lines", "Redness", "Texture"] as const;

export default function Glossary(){
    return(
        <SectionContainer tint="pink-soft" id="concern">
            <SectionTitle num="04" title="Shop by Concern" />

            <div className="grid grid-cols-6 gap-4">
                {concerns.map((concern, index) => (
                    <RevealIn key={concern} direction="bottom" delay={index * 0.09} distance={28}>
                        <a href="#" className="group flex flex-col gap-3">
                            <div className="relative aspect-[3/4] w-full overflow-hidden border border-ink/10">
                                <Image
                                    src={concernImages[concern]}
                                    alt={concern}
                                    fill
                                    sizes="(min-width: 1024px) 16vw, 33vw"
                                    className="object-cover transition duration-500 group-hover:scale-105"
                                />
                            </div>
                            <span className="text-center font-mono text-[11px] uppercase tracking-[.1em] text-ink">{concern}</span>
                        </a>
                    </RevealIn>
                ))}
            </div>
        </SectionContainer>
    )
}
