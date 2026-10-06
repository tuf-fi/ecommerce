import { RefObject, useEffect } from "react";

// A reload resets a scrollable nav to the top; this brings the current link (aria-current="page") back into view.
export function useScrollActiveIntoView(containerRef: RefObject<HTMLElement | null>, deps: unknown[]) {
    useEffect(() => {
        const box = containerRef.current;
        const link = box?.querySelector<HTMLElement>('[aria-current="page"]');
        if (!box || !link) return;
        const boxRect = box.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        if (linkRect.top < boxRect.top || linkRect.bottom > boxRect.bottom) {
            box.scrollTop += linkRect.top - boxRect.top - (boxRect.height - linkRect.height) / 2;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
