"use client";

import { useStore } from "@/library/store";
import { useAsyncAction } from "@/library/useAsyncAction";
import { ApiError } from "@/library/api/client";
import { customerGoogleSignIn } from "@/library/api/customer";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type GoogleId = {
    initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
    prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
};
const googleId = () => (window as unknown as { google?: { accounts?: { id?: GoogleId } } }).google?.accounts?.id;

// Google's sign-in script is only fetched when someone actually presses the button.
function loadGoogleScript(): Promise<void> {
    if (googleId()) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("load"));
        document.head.appendChild(s);
    });
}

export default function GoogleButton({ label = "Continue with Google", onSignedIn }: { label?: string; onSignedIn?: () => void }) {
    const { signIn, showToast } = useStore();

    const [busy, start] = useAsyncAction(async () => {
        if (!GOOGLE_CLIENT_ID) {
            showToast("error", "Google sign-in isn't available yet.");
            return;
        }
        try {
            await loadGoogleScript();
            const g = googleId();
            if (!g) throw new Error("load");
            // Google hands back a signed ID token; the server checks it with Google and starts the session.
            g.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: ({ credential }) => {
                    customerGoogleSignIn(credential)
                        .then(({ customer }) => {
                            signIn(customer);
                            onSignedIn?.();
                        })
                        .catch((err) => showToast("error", err instanceof ApiError ? err.message : "Google sign-in failed. Please try again."));
                },
            });
            g.prompt((n) => {
                if (n.isNotDisplayed() || n.isSkippedMoment()) showToast("error", "Google sign-in was closed or blocked. Allow pop-ups and try again.");
            });
        } catch {
            showToast("error", "Couldn't reach Google. Please try again.");
        }
    });

    return (
        <button type="button" onClick={start} disabled={busy} className="ui-btn ui-btn-secondary w-full">
            {!busy && (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.49 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v2.99h3.87c2.27-2.09 3.55-5.17 3.55-8.81z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.92l-3.87-2.99c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A11.998 11.998 0 0 0 12 24z" />
                    <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.09z" />
                    <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.09C6.22 6.87 8.87 4.77 12 4.77z" />
                </svg>
            )}
            {busy ? "Connecting…" : label}
        </button>
    );
}
