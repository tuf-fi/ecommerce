"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CLONED = "data-preview-clone";

// Renders its children inside an <iframe> of its own width, so the page's responsive styles (sm:/md:/lg:) react to the
// preview's width, the way they do on a real phone or tablet. A plain narrow box can't do that: media queries look at the
// browser window, not at the box. React keeps the tree, state and context as if the children were rendered in place.
export default function PreviewFrame({ children }: { children: React.ReactNode }) {
    const frame = useRef<HTMLIFrameElement>(null);
    const [mount, setMount] = useState<HTMLElement | null>(null);

    // Copies the site's stylesheets into the frame, and again whenever they change (hot reload, lazy-loaded CSS).
    const syncStyles = useCallback((doc: Document) => {
        doc.head.querySelectorAll(`[${CLONED}]`).forEach((n) => n.remove());
        document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => {
            const copy = n.cloneNode(true) as HTMLElement;
            copy.setAttribute(CLONED, "");
            doc.head.appendChild(copy);
        });
    }, []);

    const setup = useCallback(() => {
        const doc = frame.current?.contentDocument;
        if (!doc || !doc.body) return;
        if (doc.body.querySelector("[data-preview-root]")) return;

        doc.documentElement.className = document.documentElement.className;
        doc.documentElement.lang = document.documentElement.lang;
        const rootStyle = document.documentElement.getAttribute("style");
        if (rootStyle) doc.documentElement.setAttribute("style", rootStyle);
        doc.body.className = document.body.className;
        // The site's body carries the page gutter and backdrop; the previewed block brings its own spacing.
        doc.documentElement.style.overflow = "hidden";
        doc.body.style.margin = "0";
        doc.body.style.padding = "0";
        doc.body.style.background = "#fff";

        const base = doc.createElement("base");
        base.href = document.baseURI;
        doc.head.prepend(base);
        syncStyles(doc);

        const root = doc.createElement("div");
        root.setAttribute("data-preview-root", "");
        doc.body.appendChild(root);
        setMount(root);
    }, [syncStyles]);

    useEffect(() => {
        setup();
    }, [setup]);

    // Keep styles in step with the parent page.
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const doc = frame.current?.contentDocument;
            if (doc) syncStyles(doc);
        });
        observer.observe(document.head, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [syncStyles]);

    // The frame grows with its content, so the surrounding pane (or page) does the scrolling, as before.
    useEffect(() => {
        const doc = frame.current?.contentDocument;
        const el = frame.current;
        if (!mount || !doc || !el) return;
        const fit = () => {
            el.style.height = `${mount.offsetHeight}px`;
        };
        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(mount);
        return () => observer.disconnect();
    }, [mount]);

    return (
        <>
            <iframe ref={frame} title="Preview" onLoad={setup} scrolling="no" className="block h-[200px] w-full border-0 bg-white" />
            {mount && createPortal(children, mount)}
        </>
    );
}
