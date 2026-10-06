"use client";

import * as Switch from "@radix-ui/react-switch";

export default function Toggle({
    checked,
    onChange,
    id,
    ariaLabel,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    id?: string;
    ariaLabel?: string;
}) {
    return (
        <Switch.Root
            id={id}
            aria-label={ariaLabel}
            checked={checked}
            onCheckedChange={onChange}
            className="relative h-6 w-11 flex-none cursor-pointer rounded-pill border border-ink/20 bg-off outline-none transition focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 data-[state=checked]:border-navy data-[state=checked]:bg-navy"
        >
            <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform duration-150 will-change-transform data-[state=checked]:translate-x-[22px]" />
        </Switch.Root>
    );
}
