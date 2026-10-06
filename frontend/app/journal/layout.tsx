import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Journal",
    description: "Notes on skincare, routine, and ingredients from Cindyrella.",
};

export default function JournalLayout({ children }: LayoutProps<"/journal">) {
    return children;
}
