"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAdminStore } from "@/library/adminStore";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";
import { useAsyncAction, wait } from "@/library/useAsyncAction";
import { EASE } from "@/components/ui/motion/constants";

export default function LoginForm() {
    const { isAdminLoggedIn, authChecked, login } = useAdminStore();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (authChecked && isAdminLoggedIn) router.replace("/admin/dashboard");
    }, [authChecked, isAdminLoggedIn, router]);

    const [submitting, handleSubmit] = useAsyncAction(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError("Enter both an email and password.");
            return;
        }
        // `login` flips isAdminLoggedIn synchronously, which the effect above
        // immediately redirects on — so it has to run after the loading
        // delay, not before, or the redirect fires before "Signing In…" is
        // ever seen.
        await wait();
        login(email, password);
        router.push("/admin/dashboard");
    });

    return (
        <div className="-mx-8 flex min-h-screen w-[calc(100%+4rem)]">
            {/* Brand panel — hidden below lg, where the form carries the whole screen */}
            <div className="relative hidden w-[42%] flex-none flex-col justify-between bg-navy px-16 py-14 text-white lg:flex">
                <div className="font-display text-[20px] font-medium tracking-wide">Cindyrella</div>

                <div className="max-w-[380px]">
                    <div className="mb-6 flex items-center gap-x-4 uppercase">
                        <span className="font-mono text-[10.5px] text-grey-light">01</span>
                        <span className="font-mono text-[10.5px] tracking-[.16em] text-white/70">Admin Access</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" />
                    </div>
                    <h1 className="mb-4 font-display text-[36px] leading-[1.05] font-normal text-white">
                        Run the shop floor from here.
                    </h1>
                    <p className="text-[13px] leading-relaxed text-grey-light">
                        Inventory, orders, staff, and content — one panel for everyone who keeps Cindyrella running.
                    </p>
                </div>

                <div className="font-mono text-[10px] tracking-[.14em] text-white/35 uppercase">Restricted — Staff Only</div>
            </div>

            {/* Sign-in form */}
            <div className="flex flex-1 items-center justify-center bg-white px-6 py-16">
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="w-full max-w-[360px]"
                >
                    <div className="mb-10 lg:hidden">
                        <div className="mb-1 font-display text-[21px] font-medium text-ink">Cindyrella</div>
                        <div className="font-mono text-[10.5px] tracking-[.14em] text-grey uppercase">Admin Panel</div>
                    </div>

                    <div className="mb-1.5 font-mono text-[10.5px] tracking-[.16em] text-grey uppercase">Sign In</div>
                    <h2 className="mb-8 font-display text-[26px] font-normal text-ink">Welcome back.</h2>

                    <div className="mb-4">
                        <label htmlFor="admin-login-email" className={FIELD_LABEL}>Email</label>
                        <input
                            id="admin-login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@cindyrella.ph"
                            className={FIELD_INPUT}
                        />
                    </div>
                    <div className="mb-5">
                        <label htmlFor="admin-login-password" className={FIELD_LABEL}>Password</label>
                        <input
                            id="admin-login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={FIELD_INPUT}
                        />
                    </div>

                    {error && (
                        <p className="mb-4 border-l-2 border-alert bg-alert/5 px-3 py-2 text-[12px] text-alert">{error}</p>
                    )}

                    <button type="submit" disabled={submitting} className={`w-full ${BTN_PRIMARY}`}>
                        {submitting ? "Signing In…" : "Sign In"}
                    </button>

                    <p className="mt-5 text-center text-[11.5px] leading-relaxed text-grey">
                        Demo access — any email &amp; password works.
                    </p>
                </motion.form>
            </div>
        </div>
    );
}
