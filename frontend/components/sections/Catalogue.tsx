import Link from "next/link";
import Card from "../ui/Card";
import SectionContainer from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import RevealIn from "../ui/motion/RevealIn";
import { PRODUCTS } from "@/library/products";

const PREVIEW_COUNT = 12;

export default function Catalogue(){
    return(
        <SectionContainer id="products">
            <SectionTitle num="05" title="Shop All" />

            {/* TODO: wire these up to real filtering once catalogue data/state exists */}
            <div className="mb-11 flex flex-wrap gap-3">
                <select className="rounded-none border border-ink/15 bg-transparent px-4 py-2.5 font-mono text-[11px] uppercase tracking-[.1em] text-ink outline-none">
                    <option>Category</option>
                    <option>Serums</option>
                    <option>Treatments</option>
                    <option>Moisturizers</option>
                    <option>Body</option>
                    <option>Sets</option>
                </select>

                <select className="rounded-none border border-ink/15 bg-transparent px-4 py-2.5 font-mono text-[11px] uppercase tracking-[.1em] text-ink outline-none">
                    <option>All Prices</option>
                    <option>Under ₱1,500</option>
                    <option>₱1,500 – ₱2,500</option>
                    <option>₱2,500+</option>
                </select>

                <select className="rounded-none border border-ink/15 bg-transparent px-4 py-2.5 font-mono text-[11px] uppercase tracking-[.1em] text-ink outline-none">
                    <option>All Ratings</option>
                    <option>4★ &amp; up</option>
                    <option>4.5★ &amp; up</option>
                </select>
            </div>

            <div id="catalogTop" className="grid grid-cols-4 gap-5">
                {PRODUCTS.slice(0, PREVIEW_COUNT).map((product, index) => (
                    <RevealIn
                        key={product.id}
                        direction="bottom"
                        distance={28}
                        delay={Math.floor(index / 4) * 0.12 + (index % 4) * 0.08}
                    >
                        <Card product={product} />
                    </RevealIn>
                ))}
            </div>

            <RevealIn direction="bottom" delay={0.45} distance={20} className="mt-14 flex justify-center">
                <Link
                    href="/shop"
                    className="group/cta inline-flex items-center gap-2.5 bg-navy px-8 py-4 text-[13px] font-semibold uppercase tracking-wide text-white transition hover:bg-pink-dark"
                >
                    Go to Shop
                    <span className="transition-transform duration-200 group-hover/cta:translate-x-1">→</span>
                </Link>
            </RevealIn>
        </SectionContainer>
    )
}
