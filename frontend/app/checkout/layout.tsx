import type { Metadata } from "next";

// Needs a signed-in customer with a bag; keep it out of search results.
export const metadata: Metadata = {
    title: "Check out",
    robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
