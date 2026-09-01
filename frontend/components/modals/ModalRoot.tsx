"use client";

import ProductModal from "./ProductModal";
import LoginModal from "./LoginModal";
import WelcomePromoModal from "./WelcomePromoModal";
import QuizModal from "./QuizModal";

export default function ModalRoot() {
    return (
        <>
            <ProductModal />
            <LoginModal />
            <WelcomePromoModal />
            <QuizModal />
        </>
    );
}
