import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gates every /admin/* route at the edge, before any admin markup or JS ever
// reaches the browser — hitting /admin/dashboard (or any nested admin route)
// directly with no session redirects straight to /admin/login server-side,
// instead of the page briefly rendering while a client effect decides to
// bounce you. This is the fix for "a user can't open [the admin panel]
// randomly": today that's an unauthenticated stranger typing the URL; the
// gate itself is not yet cryptographically secure (see below).
//
// TODO: this only checks that a cookie *exists* — it's the same demo-only
// "logged in" flag `library/adminStore.tsx` already kept in localStorage,
// just mirrored into a cookie because Proxy has no access to localStorage.
// It stops random/accidental access, not a determined attacker (the cookie
// is forgeable from devtools). Once a real backend exists, replace this with
// a signed, httpOnly session cookie verified against the server.
const SESSION_COOKIE = "cindyrella_admin_session";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isLoggedIn = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

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
