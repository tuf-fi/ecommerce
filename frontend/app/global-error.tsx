"use client";

// Last-resort screen when the root layout itself fails. It replaces <html>, so it carries its own minimal styling.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="en">
            <body style={{ margin: 0, background: "#F2F1EE", color: "#12233A", fontFamily: "system-ui, sans-serif" }}>
                <div role="alert" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", maxWidth: 560, margin: "0 auto" }}>
                    <h1 style={{ fontSize: 34, fontWeight: 500, margin: "0 0 12px" }}>Something went wrong.</h1>
                    <p style={{ color: "#5B6169", lineHeight: 1.6, margin: "0 0 24px" }}>Please try again. If it keeps happening, come back in a little while.</p>
                    <button type="button" onClick={reset} style={{ alignSelf: "flex-start", minHeight: 44, padding: "0 24px", background: "#0F2036", color: "#fff", border: 0, fontWeight: 600, cursor: "pointer" }}>
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
