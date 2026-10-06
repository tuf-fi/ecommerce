// Kept in one place so every modal/editor uses the same input language as the customer account pages.
export const FIELD_LABEL = "mb-1.5 block font-mono text-[11px] uppercase tracking-[.14em] text-grey";
// `rounded-none` is a deliberate override: bare <select> elements pick up daisyUI's default corner radius otherwise.
export const FIELD_INPUT =
    "w-full rounded-none border border-ink/10 px-4 py-3 text-sm text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 disabled:bg-off disabled:text-grey";
export const FIELD_TEXTAREA = `${FIELD_INPUT} resize-none leading-relaxed`;
export const FIELD_ERROR = "mt-1.5 text-[11.5px] text-alert";
export const FIELD_INPUT_INVALID = "border-alert/60 focus:border-alert/60";

export const BTN_PRIMARY = "bg-navy py-3.5 px-4 text-[13px] font-semibold tracking-wide text-white transition hover:bg-pink-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-navy";
// `h-11` (not padding-driven) so this lines up with FILTER_SELECT/SearchField — a <select>'s native chrome renders taller at identical padding.
export const BTN_ADD = "flex h-11 items-center bg-pink-btn px-5 text-[12.5px] font-semibold tracking-wide text-white transition hover:bg-pink-btn-hover";
// Hovers blue, not pink: pink-btn is reserved for primary CTAs (BTN_ADD) per the brand's color rules.
export const BTN_SECONDARY = "flex h-11 items-center gap-2 border border-ink/15 px-4 text-[12.5px] font-semibold tracking-wide text-ink transition hover:border-blue-accent hover:bg-blue-accent hover:text-white";

// h-11/w-11 (44px) is the minimum touch target; these sat at h-8 (32px) before that rule landed.
export const ICON_BTN = "flex h-11 w-11 flex-none items-center justify-center rounded-full text-ink transition hover:bg-off";
export const ICON_BTN_DANGER = "flex h-11 w-11 flex-none items-center justify-center rounded-full text-alert transition hover:bg-alert/5";

// bg-white plus a hairline border (not a filled pill) keeps the same flat, chrome-free control language as the rest of the admin surface.
export const FILTER_SELECT = "admin-select h-11 rounded-none border border-ink/10 bg-white pl-3.5 pr-8 text-[12.5px] text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1";

// Breaks a section out of the root layout's px-8 padding to run edge-to-edge; `4rem` assumes that padding is exactly 2rem on both sides.
export const FULL_BLEED = "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)]";

export const BTN_HEADER_ACTION = "border border-ink/15 px-5 py-2 whitespace-nowrap text-[12.5px] font-semibold tracking-wide text-ink transition hover:border-pink-btn hover:bg-pink-btn hover:text-white";

// BulkActionBar's own buttons sit on its dark navy bar and need their own white-on-transparent language; don't fold DANGER and SECONDARY into one "outline" class.
export const BTN_BULK_PRIMARY = "flex h-9 items-center bg-pink-btn px-4 text-[12px] font-semibold text-white transition hover:bg-pink-btn-hover";
export const BTN_BULK_DANGER = "flex h-9 items-center border border-white/40 px-3.5 text-[12px] font-semibold text-white transition hover:border-alert hover:bg-alert";
export const BTN_BULK_SECONDARY = "flex h-9 items-center border border-white/25 px-3.5 text-[12px] font-semibold text-white transition hover:border-white hover:bg-white/10";

// Shared by every list table (ListPanel) so header and cell treatment match across the admin.
export const TABLE_HEAD_ROW = "bg-off/50";
export const TABLE_TH = "whitespace-nowrap border-b border-ink/10 px-5 py-3.5 text-left font-mono text-[11px] tracking-[.12em] text-grey uppercase";
export const TABLE_TD = "border-b border-ink/10 px-5 py-3.5";
// Form panel: fields in a body, actions in a right-aligned footer strip (Change Password, Shipping, Discount Codes).
export const FORM_PANEL = "border border-ink/10 bg-white";
export const FORM_PANEL_FOOTER = "flex items-center justify-end border-t border-ink/10 bg-off/40 px-6 py-4 sm:px-7";
