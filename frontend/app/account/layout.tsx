import type { Metadata } from "next";
import AccountShell from "@/components/account/AccountShell";

// Auth-gated client-only page; keep it out of search results.
export const metadata: Metadata = {
    title: "My Account",
    robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return <AccountShell>{children}</AccountShell>;
}
