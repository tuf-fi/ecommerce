"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/library/adminStore";
import { BTN_PRIMARY, FIELD_INPUT, FIELD_LABEL } from "@/components/admin/formClasses";

export default function LoginForm() {
    const { isAdminLoggedIn, authChecked, login } = useAdminStore();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (authChecked && isAdminLoggedIn) router.replace("/admin/dashboard");
    }, [authChecked, isAdminLoggedIn, router]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const ok = login(email, password);
        if (!ok) {
            setError("Enter both an email and password.");
            return;
        }
        router.push("/admin/dashboard");
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-navy px-6">
            <form onSubmit={handleSubmit} className="w-full max-w-[380px] border border-white/10 bg-white px-8 py-10 shadow-modal">
                <div className="mb-1 text-[21px] font-medium text-ink">Cindyrella</div>
                <div className="mb-7 font-mono text-[10.5px] tracking-[.14em] text-grey uppercase">Admin Panel</div>

                <div className="mb-4">
                    <label className={FIELD_LABEL}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@cindyrella.ph"
                        className={FIELD_INPUT}
                    />
                </div>
                <div className="mb-2">
                    <label className={FIELD_LABEL}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={FIELD_INPUT}
                    />
                </div>

                {error && <p className="mb-2 text-[12px] text-alert">{error}</p>}

                <p className="mb-6 text-[12px] leading-relaxed text-grey">Demo access — any email &amp; password works.</p>

                <button type="submit" className={`w-full ${BTN_PRIMARY}`}>
                    Sign In
                </button>
            </form>
        </div>
    );
}
