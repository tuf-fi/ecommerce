import { AdminProvider } from "@/library/adminStore";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return <AdminProvider>{children}</AdminProvider>;
}
