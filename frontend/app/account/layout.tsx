import type { Metadata } from "next";
import AccountShell from "@/components/account/AccountShell";

// Auth-gated client-only pages carry nothing worth indexing, and shouldn't
// show up in search results for an unauthenticated crawler that reaches them.
export const metadata: Metadata = {
    title: "My Account",
    robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return <AccountShell>{children}</AccountShell>;
}
