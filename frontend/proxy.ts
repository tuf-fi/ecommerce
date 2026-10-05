import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gates every /admin/* route at the edge, before any admin markup or JS reaches the browser.
// The session is validated by the backend (signature, expiry, and that the staff account still
// exists) — a forged or stale cookie is rejected, not just a missing one.
const SESSION_COOKIE = "admin_token";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Fails closed: if the API is down or errors, the user is treated as signed out.
async function hasValidSession(request: NextRequest): Promise<boolean> {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return false;
    try {
        const res = await fetch(`${API_URL}/auth/admin/session`, {
            headers: { cookie: `${SESSION_COOKIE}=${token}` },
            cache: "no-store",
        });
        return res.ok;
    } catch {
        return false;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isLoggedIn = await hasValidSession(request);

    if (pathname === "/admin/login") {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
        return NextResponse.next();
    }

    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
