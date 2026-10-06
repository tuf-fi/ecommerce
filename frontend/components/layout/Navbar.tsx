"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/library/store";
import { useContent } from "@/library/content";
import { SiteNavLink } from "@/library/admin/types";
import { SECTION_ANCHOR_ID } from "@/library/admin/sections";
import { EASE } from "../ui/motion/constants";
import Tooltip from "../ui/Tooltip";
import NotificationBell from "./NotificationBell";

// Not CMS-managed — it duplicates the wordmark's scroll-to-top, not a section, so there's nothing for an admin to edit.
const HOME_LABEL = "Home";

export default function Navbar(){
    const [scrolled, setScrolled] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { isLoggedIn, customerName, openModal, signOut, wishlist, cartCount } = useStore();
    const { navLinks, sectionVisibility } = useContent();
    const pathname = usePathname();
    const router = useRouter();
    const topBarRef = useRef<HTMLDivElement>(null);
    const moreRef = useRef<HTMLLIElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        handleScroll();
        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Closes the mobile panel on route change so it never lingers over the destination page.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    useEffect(() => { setMenuOpen(false); setMoreOpen(false); }, [pathname]);
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Only the home page has a dark hero to sit transparently over — every other route needs the nav solid immediately.
    const solid = scrolled || pathname !== "/";

    // Publishes the nav's real rendered height as a CSS var (`--navbar-h`), same trick as PromoBanner's `--promo-h`.
    useLayoutEffect(() => {
        const el = topBarRef.current;
        if (!el) return;
        const update = () => {
            const borderBottom = solid ? 1 : 0;
            document.documentElement.style.setProperty("--navbar-h", `${el.offsetHeight + borderBottom}px`);
        };
        update();
        // ResizeObserver alone can catch the topbar mid-transition and leave `--navbar-h` stale; transitionend re-measures once it settles.
        el.addEventListener("transitionend", update);
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => {
            el.removeEventListener("transitionend", update);
            observer.disconnect();
        };
    }, [solid]);

    // A link whose section is switched off in the CMS would scroll to a nonexistent element, so it's dropped from the nav entirely.
    const visibleNavLinks = useMemo(
        () => navLinks.filter((link) => sectionVisibility[link.section]),
        [navLinks, sectionVisibility]
    );
    const mainNavLinks = visibleNavLinks.filter((link) => link.group !== "more");
    const moreNavLinks = visibleNavLinks.filter((link) => link.group === "more");

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

    function handleNavClick(link: SiteNavLink) {
        setMenuOpen(false);
        // Empty anchor means the top of the page — Hero has no id.
        goToSection(SECTION_ANCHOR_ID[link.section] || null);
    }

    function handleHomeClick() {
        setMenuOpen(false);
        goToSection(null);
    }

    return(
    <nav className={`fixed top-[var(--promo-h,0px)] left-0 z-50 w-full text-white transition-[background-color,backdrop-filter,padding,border-color] duration-300
    ${solid ? "border-b border-white/10 bg-navy" : "border-b border-transparent"}`}>
        <div ref={topBarRef} className={`flex items-center justify-between px-(--gutter) transition-[padding] duration-300 ${solid ? "py-3.5" : "py-5"}`}>
            <div className="flex items-center gap-x-8 xl:gap-x-16">
                <button onClick={handleHomeClick} className="font-display text-[19px] font-medium tracking-tight">
                    Cindyrella
                </button>

                <ul className="hidden items-center gap-x-9 font-mono text-[10.5px] uppercase tracking-[.12em] lg:flex">
                    {mainNavLinks.map((link) => (
                        <li key={link.id}>
                            <button onClick={() => handleNavClick(link)} className="group/link relative py-1 text-white/65 transition-colors duration-200 hover:text-white">
                                {link.label}
                                <span className="absolute inset-x-0 -bottom-0 h-px origin-left scale-x-0 bg-white/70 transition-transform duration-300 ease-out group-hover/link:scale-x-100" />
                            </button>
                        </li>
                    ))}
                    {/* Hidden once every "more" link's section is switched off — an empty dropdown would be a dead button. */}
                    <li ref={moreRef} className={`relative ${moreNavLinks.length === 0 ? "hidden" : ""}`}>
                        <button
                            onClick={() => setMoreOpen((o) => !o)}
                            className="group/link relative py-1 text-white/65 transition-colors duration-200 hover:text-white"
                        >
                            More
                            <span className="absolute inset-x-0 -bottom-0 h-px origin-left scale-x-0 bg-white/70 transition-transform duration-300 ease-out group-hover/link:scale-x-100" />
                        </button>

                        {moreOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 border border-white/10 bg-navy py-2 text-white shadow-modal">
                                {moreNavLinks.map((link) => (
                                    <button
                                        key={link.id}
                                        onClick={() => { setMoreOpen(false); handleNavClick(link); }}
                                        className="block w-full px-4 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[.12em] text-white/65 transition hover:bg-white/5 hover:text-white"
                                    >
                                        {link.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </li>
                </ul>
            </div>

            <div className="flex items-center gap-x-5">
                <Link
                    href="/shop"
                    className="hidden border border-pink px-4 py-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[.14em] text-pink transition-colors duration-200 hover:border-pink-btn hover:bg-pink-btn hover:text-white lg:inline-block"
                >
                    Shop
                </Link>

                <div className="flex items-center gap-x-1 border-l border-white/10 pl-4">
                    <div ref={accountRef} className="relative">
                        <Tooltip label={isLoggedIn ? "Account" : "Sign in"}>
                            <button
                                aria-label="Account"
                                onClick={handleAccountClick}
                                className="flex h-10 w-10 items-center justify-center text-white/80 transition hover:bg-white/10 hover:text-white"
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </button>
                        </Tooltip>

                        {accountOpen && isLoggedIn && (
                            <div className="absolute right-0 top-full mt-2 w-60 border border-ink/10 bg-white py-2 text-ink shadow-modal">
                                <div className="px-4 py-3">
                                    <div className="text-[13px] text-ink">Hi, {customerName}</div>
                                </div>
                                <div className="my-1 border-t border-ink/10" />
                                <button
                                    onClick={() => { setAccountOpen(false); router.push("/account"); }}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] transition hover:bg-ink/5"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-none text-grey">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    View Profile
                                </button>
                                <div className="my-1 border-t border-ink/10" />
                                <button onClick={() => { setAccountOpen(false); signOut(); }} className="block w-full px-4 py-2.5 text-left text-[12.5px] text-pink-dark transition hover:bg-ink/5">
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>

                    {isLoggedIn && <NotificationBell />}

                    <Tooltip label="Wishlist">
                        <button
                            aria-label="Wishlist"
                            onClick={() => router.push("/wishlist")}
                            className="relative flex h-10 w-10 items-center justify-center text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
                            className="relative flex h-10 w-10 items-center justify-center text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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

                <button
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex h-10 w-10 flex-none items-center justify-center text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
                    </svg>
                </button>
            </div>
        </div>

        <AnimatePresence>
            {menuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.26, ease: EASE }}
                    className="overflow-hidden border-t border-white/10 bg-navy lg:hidden"
                >
                    {/* Ignores the "more" grouping — renders one flat list; no horizontal room to run out of here. */}
                    <ul className="flex flex-col px-(--gutter) py-2">
                        <li className="border-b border-white/5 last:border-none">
                            <button
                                onClick={handleHomeClick}
                                className="w-full py-3.5 text-left font-mono text-[11px] uppercase tracking-[.12em] text-white/70 transition-colors hover:text-white"
                            >
                                {HOME_LABEL}
                            </button>
                        </li>
                        {visibleNavLinks.map((link) => (
                            <li key={link.id} className="border-b border-white/5 last:border-none">
                                <button
                                    onClick={() => handleNavClick(link)}
                                    className="w-full py-3.5 text-left font-mono text-[11px] uppercase tracking-[.12em] text-white/70 transition-colors hover:text-white"
                                >
                                    {link.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="px-(--gutter) pb-6 pt-2">
                        <Link
                            href="/shop"
                            onClick={() => setMenuOpen(false)}
                            className="block border border-pink px-4 py-3 text-center font-mono text-[10.5px] font-semibold uppercase tracking-[.14em] text-pink transition-colors duration-200 hover:border-pink-btn hover:bg-pink-btn hover:text-white"
                        >
                            Shop
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </nav>
    )
}
