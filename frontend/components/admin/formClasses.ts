// Shared class strings for admin form fields — kept in one place purely so
// every modal/editor uses the exact same input language as the customer
// account pages (see app/account/addresses/page.tsx), not because the values
// vary per call site.
export const FIELD_LABEL = "mb-1.5 block font-mono text-[10.5px] uppercase tracking-[.14em] text-grey";
// `rounded-none` is a deliberate override, not a no-op: bare <select> elements
// pick up daisyUI's default corner radius even with no rounded-* class of our
// own present, so every field/select needs this explicit reset.
export const FIELD_INPUT =
    "w-full rounded-none border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 disabled:bg-off disabled:text-grey";
export const FIELD_TEXTAREA = `${FIELD_INPUT} resize-none leading-relaxed`;

export const BTN_PRIMARY = "bg-navy py-3.5 px-4 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-navy";
// `h-11` (not padding-driven) so this lines up exactly with FILTER_SELECT/SearchField below —
// a <select>'s native chrome renders taller than a plain <button> at identical padding.
export const BTN_ADD = "flex h-11 items-center bg-pink-btn px-5 text-[12.5px] font-semibold tracking-wide text-white transition hover:bg-pink-btn-hover";
// Outline counterpart to BTN_ADD — same h-11 sizing so the two sit flush in a
// toolbar together (e.g. Import/Export next to + Add Product).
export const BTN_SECONDARY = "flex h-11 items-center gap-2 border border-ink/15 px-4 text-[12.5px] font-semibold tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white";

export const ICON_BTN = "flex h-8 w-8 flex-none items-center justify-center rounded-full border border-ink/10 text-ink transition hover:border-ink/25 hover:bg-off";
export const ICON_BTN_DANGER = "flex h-8 w-8 flex-none items-center justify-center rounded-full border border-ink/10 text-alert transition hover:border-alert/40 hover:bg-alert/5";

export const FILTER_SELECT = "h-11 rounded-none border border-ink/10 bg-off/50 px-3.5 text-[12.5px] text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1";
