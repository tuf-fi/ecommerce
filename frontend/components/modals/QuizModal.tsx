"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Modal from "../ui/Modal";
import { useStore } from "@/library/store";
import { PRODUCTS } from "@/library/products";

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
        <Modal open={open} onClose={closeModal} maxWidth="max-w-[460px]">
            <div className="p-5 sm:p-8">{open && <QuizContent key={String(open)} onOpenProduct={goToProduct} onDone={closeModal} />}</div>
        </Modal>
    );
}

function QuizContent({ onOpenProduct, onDone }: { onOpenProduct: (id: number) => void; onDone: () => void }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);

    function answer(key: string) {
        setAnswers((a) => [...a, key]);
        setStep((s) => s + 1);
    }

    function retake() {
        setAnswers([]);
        setStep(0);
    }

    if (step >= QUIZ_QUESTIONS.length) {
        const picks = pickProducts(answers);
        return (
            <div>
                <div className="eyebrow mb-2.5 text-pink-dark">✦ Your Match</div>
                <h3 className="mb-2 text-xl font-medium text-ink">Your routine, considered.</h3>
                <p className="mb-5 text-[12.5px] text-grey">Based on your answers, here&apos;s where we&apos;d start.</p>
                <div className="mb-5 flex flex-col gap-3.5">
                    {picks.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => {
                                onOpenProduct(p.id);
                            }}
                            className="flex items-center gap-3 text-left"
                        >
                            <div className="relative h-[52px] w-[52px] flex-none overflow-hidden">
                                <Image src={p.image} alt={p.title} fill sizes="52px" className="object-cover" />
                            </div>
                            <div>
                                <div className="text-[13.5px] text-ink">{p.title}</div>
                                <div className="font-mono text-[11px] text-grey">₱{p.price.toLocaleString()}</div>
                            </div>
                        </button>
                    ))}
                </div>
                <button onClick={onDone} className="w-full bg-navy py-3.5 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark">
                    Shop These Picks
                </button>
                <button onClick={retake} className="mt-2.5 w-full border border-ink/15 py-3.5 text-[13px] font-semibold tracking-wide text-ink transition hover:bg-off">
                    Retake Quiz
                </button>
            </div>
        );
    }

    const q = QUIZ_QUESTIONS[step];
    return (
        <div>
            <div className="eyebrow mb-4 text-grey">
                Question {step + 1} of {QUIZ_QUESTIONS.length}
            </div>
            <h3 className="mb-6 text-xl font-medium text-ink">{q.q}</h3>
            <div className="flex flex-col gap-2.5">
                {q.options.map((o) => (
                    <button
                        key={o.key}
                        onClick={() => answer(o.key)}
                        className="border border-ink/15 px-4 py-3.5 text-left text-[13.5px] text-ink transition hover:border-pink-dark hover:bg-off"
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
