import Image from "next/image";
import SectionContainer from "../ui/Section";
import FadeIn from "../ui/motion/FadeIn";
import { philosophyImage } from "../ui/images";

export default function Philosophy(){
    return(
        <SectionContainer>
            <FadeIn className="relative flex -mx-8 w-[calc(100%+4rem)] overflow-hidden bg-navy">
                <div className="relative hidden w-[45%] flex-shrink-0 overflow-hidden sm:block">
                    <Image src={philosophyImage} alt="Philosophy" fill sizes="45vw" className="object-cover" />
                    <div aria-hidden className="pointer-events-none absolute -top-[100px] -left-[80px] h-[280px] w-[280px] rounded-full bg-pink opacity-14 blur-[70px]" />
                </div>

                <div className="philosophy-text flex w-full flex-col justify-center gap-y-8 p-16 sm:w-[55%]">
                    <span className="eyebrow">N° 002 — Philosophy</span>

                    <p className="philosophy text-white text-[clamp(24px,2.6vw,36px)]">Good skin isn&apos;t <em className="grey-highlight not-italic">fixed</em> overnight. It&apos;s the sum of small, consistent choices, applied with care.</p>
                    <p className="philosophy-subText max-w-[440px] text-grey-light">Every formula is built around fewer, better ingredients — layered in an order that actually works with your skin, not against it.</p>
                </div>
            </FadeIn>
        </SectionContainer>
    )
}
