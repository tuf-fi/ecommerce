import { Suspense } from "react";
import { AdminProvider } from "@/library/adminStore";
import AdminNavTracker from "@/components/admin/AdminNavTracker";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminProvider>
            <Suspense fallback={null}>
                <AdminNavTracker />
            </Suspense>
            {children}
        </AdminProvider>
    );
}
