"use client";

import LoginModal from "./LoginModal";
import WelcomePromoModal from "./WelcomePromoModal";
import QuizModal from "./QuizModal";

export default function ModalRoot() {
    return (
        <>
            <LoginModal />
            <WelcomePromoModal />
            <QuizModal />
        </>
    );
}
