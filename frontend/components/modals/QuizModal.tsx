"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "../ui/Modal";
import { EASE } from "../ui/motion/constants";
import { useStore } from "@/library/store";
import { PRODUCTS } from "@/library/products";
import PriceTag from "@/components/ui/PriceTag";

const QUIZ_QUESTIONS = [
    {
        q: "How would you describe your skin?",
        options: [
            { label: "Dry or tight", key: "dry" },
            { label: "Oily or shiny", key: "oily" },
            { label: "Sensitive & reactive", key: "sensitive" },
            { label: "Combination", key: "combo" },
        ],
    },
    {
        q: "What's your main concern right now?",
        options: [
            { label: "Fine lines & aging", key: "aging" },
            { label: "Breakouts & texture", key: "acne" },
            { label: "Dullness & uneven tone", key: "dull" },
            { label: "Dehydration", key: "hydration" },
        ],
    },
    {
        q: "How many steps do you want in your routine?",
        options: [
            { label: "Just the essentials", key: "minimal" },
            { label: "A full multi-step ritual", key: "full" },
        ],
    },
] as const;

function pickProducts(answers: string[]) {
    const [skin, concern, complexity] = answers;
    let matchCats: string[] = [];
    if (concern === "aging") matchCats = ["Treatment"];
    else if (concern === "acne") matchCats = ["Treatment", "Serum"];
    else if (concern === "dull") matchCats = ["Serum"];
    else matchCats = ["Serum", "Moisturizer"];
    if (skin === "dry") matchCats.push("Moisturizer");
    if (skin === "oily") matchCats.push("Serum");

    let picks = PRODUCTS.filter((p) => matchCats.includes(p.category));
    picks = complexity === "minimal" ? picks.slice(0, 2) : picks.slice(0, 3);
    if (picks.length === 0) picks = PRODUCTS.slice(0, 3);
    return picks;
}

export default function QuizModal() {
    const { activeModal, closeModal } = useStore();
    const router = useRouter();
    const open = activeModal === "quiz";

    function goToProduct(id: number) {
        closeModal();
        router.push(`/shop/${id}`);
    }

    return (
        <Modal open={open} onClose={closeModal} maxWidth="max-w-[480px]">
            <div className="p-5 sm:p-8">{open && <QuizContent key={String(open)} onOpenProduct={goToProduct} onDone={closeModal} />}</div>
        </Modal>
    );
}

const slide = {
    initial: (d: number) => ({ opacity: 0, x: d * 28 }),
    animate: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -28 }),
};

const ARROW = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
);

function QuizContent({ onOpenProduct, onDone }: { onOpenProduct: (id: number) => void; onDone: () => void }) {
    const total = QUIZ_QUESTIONS.length;
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [picked, setPicked] = useState<string | null>(null);
    const [dir, setDir] = useState(1);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const done = step >= total;

    // A short beat on the chosen option before moving on, so the tap registers.
    function answer(key: string) {
        if (picked) return;
        setPicked(key);
        timer.current = setTimeout(() => {
            setAnswers((a) => [...a, key]);
            setDir(1);
            setStep((s) => s + 1);
            setPicked(null);
        }, 340);
    }

    function back() {
        if (picked) return;
        setAnswers((a) => a.slice(0, -1));
        setDir(-1);
        setStep((s) => s - 1);
    }

    function retake() {
        setAnswers([]);
        setDir(-1);
        setStep(0);
    }

    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        []
    );

    // Number keys pick the matching option.
    useEffect(() => {
        if (done) return;
        function onKey(e: KeyboardEvent) {
            const opt = QUIZ_QUESTIONS[step].options[Number(e.key) - 1];
            if (opt) answer(opt.key);
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, done, picked]);

    return (
        <div>
            <div className="mb-7 pr-10">
                <div className="mb-3 flex h-5 items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[.14em] text-grey uppercase">
                        {done ? "Your match" : `${String(step + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
                    </span>
                    {step > 0 && !done && (
                        <button onClick={back} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-grey transition-colors hover:text-pink-dark focus-visible:ring-2 focus-visible:ring-navy">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M11 18l-6-6 6-6" />
                            </svg>
                            Back
                        </button>
                    )}
                </div>
                <div className="flex gap-1.5" aria-hidden>
                    {QUIZ_QUESTIONS.map((_, i) => (
                        <span key={i} className="h-[3px] flex-1 overflow-hidden bg-ink/10">
                            <motion.span
                                className="block h-full origin-left bg-navy"
                                animate={{ scaleX: i < step || done || (i === step && picked) ? 1 : 0 }}
                                transition={{ duration: 0.4, ease: EASE }}
                            />
                        </span>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div key={step} custom={dir} variants={slide} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.24, ease: EASE }}>
                    {done ? (
                        <Results answers={answers} onOpenProduct={onOpenProduct} onDone={onDone} onRetake={retake} />
                    ) : (
                        <Question step={step} picked={picked} onAnswer={answer} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Question({ step, picked, onAnswer }: { step: number; picked: string | null; onAnswer: (key: string) => void }) {
    const q = QUIZ_QUESTIONS[step];
    return (
        <div>
            <h3 className="mb-6 text-[22px] leading-[1.15] font-medium text-ink sm:text-[26px]">{q.q}</h3>
            <div className="flex flex-col gap-2.5">
                {q.options.map((o, i) => {
                    const isPicked = picked === o.key;
                    return (
                        <motion.button
                            key={o.key}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => onAnswer(o.key)}
                            className={`group flex w-full items-center gap-4 border px-4 py-4 text-left text-[14px] transition-colors focus-visible:ring-2 focus-visible:ring-navy ${
                                isPicked ? "border-navy bg-navy text-white" : picked ? "border-ink/10 text-ink/40" : "border-ink/15 text-ink hover:border-ink/40 hover:bg-off/70"
                            }`}
                        >
                            <span className={`w-5 flex-none font-mono text-[11px] ${isPicked ? "text-white/60" : "text-grey"}`}>{String(i + 1).padStart(2, "0")}</span>
                            <span className="flex-1">{o.label}</span>
                            {isPicked ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            ) : (
                                <span className="-translate-x-1 text-ink/50 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">{ARROW}</span>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

function Results({ answers, onOpenProduct, onDone, onRetake }: { answers: string[]; onOpenProduct: (id: number) => void; onDone: () => void; onRetake: () => void }) {
    const picks = pickProducts(answers);
    return (
        <div>
            <h3 className="mb-2 text-[22px] leading-[1.15] font-medium text-ink sm:text-[26px]">Your routine, considered.</h3>
            <p className="mb-6 text-[13px] text-grey">Based on your answers, here&apos;s where we&apos;d start.</p>
            <div className="mb-6 flex flex-col gap-2.5">
                {picks.map((p, i) => (
                    <motion.button
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: EASE, delay: 0.08 + i * 0.08 }}
                        onClick={() => onOpenProduct(p.id)}
                        className="group flex items-center gap-4 border border-ink/10 p-2.5 pr-4 text-left transition-colors hover:border-ink/35 focus-visible:ring-2 focus-visible:ring-navy"
                    >
                        <span className="relative h-[60px] w-[60px] flex-none overflow-hidden">
                            <Image src={p.image} alt="" fill sizes="60px" className="object-cover transition duration-500 group-hover:scale-105" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-mono text-[10px] tracking-[.14em] text-grey uppercase">{p.category}</span>
                            <span className="block truncate text-[14px] font-medium text-ink">{p.title}</span>
                            <PriceTag price={p.price} salePrice={p.salePrice} className="block font-mono text-[12px] text-grey" />
                        </span>
                        <span className="-translate-x-1 text-ink/50 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100">{ARROW}</span>
                    </motion.button>
                ))}
            </div>
            <button onClick={onDone} className="w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark">
                Shop These Picks
            </button>
            <button onClick={onRetake} className="mt-2.5 w-full border border-ink/15 py-3.5 text-[13px] font-semibold tracking-wide text-ink transition hover:bg-off">
                Retake Quiz
            </button>
        </div>
    );
}
