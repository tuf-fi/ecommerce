"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/library/store";
import Tooltip from "../ui/Tooltip";

type NavLink = { label: string; id: string | null; href?: string };

const navLinks: NavLink[] = [
    { label: "Home", id: null },
    { label: "About", id: "about" },
    { label: "Best Sellers", id: "bestsellers" },
    { label: "Rituals", id: "rituals" },
    { label: "Concern", id: "concern" },
    { label: "Products", id: "products" },
    { label: "Journal", id: "journal" },
    { label: "Testimonials", id: "testimonials" },
    { label: "FAQ", id: "faq" },
    { label: "Contact", id: "contact" },
];

export default function Navbar(){
    const [scrolled, setScrolled] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const { isLoggedIn, customerName, openModal, signOut, wishlist, cartCount } = useStore();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        handleScroll();
        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Only the home page has a dark hero to sit transparently over — every
    // other route has a light background from the top, so the nav must be
    // solid immediately or its white text/icons disappear.
    const solid = scrolled || pathname !== "/";

    function handleAccountClick() {
        if (isLoggedIn) setAccountOpen((o) => !o);
        else openModal("login");
    }

    function goToSection(id: string | null) {
        if (pathname !== "/") {
            router.push(id ? `/#${id}` : "/");
            return;
        }
        if (!id) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }

    function handleNavClick(link: NavLink) {
        if (link.href) {
            router.push(link.href);
            return;
        }
        goToSection(link.id);
    }

    return(
    <nav className={`flex text-white justify-between items-center px-8 py-4 fixed top-[var(--promo-h,0px)] left-0 w-full z-50
    transition-all duration-300 ${solid ? "bg-navy/90 backdrop-blur-md border-b border-white/10" : "border-b border-transparent"}`}>
        <div className="nav-left flex justify-between items-center gap-x-12">
            <div className="logo">
                <h3 className="text-lg font-normal tracking-tight">Cindyrella</h3>
            </div>

            <div className="product-links hidden md:block">
                <ul className="flex items-center gap-x-6 font-mono text-[10.5px] uppercase tracking-[.1em]">
                    {navLinks.map((link) => (
                        <li key={link.label}>
                            <button onClick={() => handleNavClick(link)} className="group/link relative pb-1 text-white/75 transition-colors duration-200 hover:text-white">
                                {link.label}
                                <span className="absolute inset-x-0 -bottom-0 h-px origin-left scale-x-0 bg-white/70 transition-transform duration-300 ease-out group-hover/link:scale-x-100" />
                            </button>
                        </li>
                    ))}
                    <li>
                        <Link
                            href="/shop"
                            className="border border-pink px-3.5 py-[6px] font-semibold tracking-[.12em] text-pink transition-colors duration-200 hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                        >
                            Shop
                        </Link>
                    </li>
                </ul>
            </div>
        </div>

        <div className="nav-right flex items-center gap-x-2">
            <div className="relative">
                <Tooltip label={isLoggedIn ? "Account" : "Sign in"}>
                    <button
                        aria-label="Account"
                        onClick={handleAccountClick}
                        className="flex h-9 w-9 items-center justify-center opacity-90 transition hover:bg-white/10 hover:opacity-100"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>
                </Tooltip>

                {accountOpen && isLoggedIn && (
                    <div className="absolute right-0 top-full mt-2 w-60 border border-white/10 bg-navy py-2 text-white shadow-modal">
                        <div className="px-4 py-3">
                            <div className="text-[13px] text-white">Hi, {customerName}</div>
                        </div>
                        <div className="my-1 border-t border-white/10" />
                        <button
                            onClick={() => { setAccountOpen(false); router.push("/account"); }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] transition hover:bg-white/5"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-none text-grey-light">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            View Profile
                        </button>
                        <div className="my-1 border-t border-white/10" />
                        <button onClick={() => { setAccountOpen(false); signOut(); }} className="block w-full px-4 py-2.5 text-left text-[12.5px] text-pink transition hover:bg-white/5">
                            Sign out
                        </button>
                    </div>
                )}
            </div>

            <Tooltip label="Wishlist">
                <button
                    aria-label="Wishlist"
                    onClick={() => router.push("/wishlist")}
                    className="relative flex h-9 w-9 items-center justify-center opacity-90 transition hover:bg-white/10 hover:opacity-100"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                    {wishlist.length > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-pink-btn text-[9px] font-semibold">
                            {wishlist.length}
                        </span>
                    )}
                </button>
            </Tooltip>

            <Tooltip label="Cart">
                <button
                    aria-label="Cart"
                    onClick={() => router.push("/cart")}
                    className="relative flex h-9 w-9 items-center justify-center opacity-90 transition hover:bg-white/10 hover:opacity-100"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                        <path d="M3 6h18" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    {cartCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-pink-btn text-[9px] font-semibold">
                            {cartCount}
                        </span>
                    )}
                </button>
            </Tooltip>
        </div>
    </nav>
    )
}
