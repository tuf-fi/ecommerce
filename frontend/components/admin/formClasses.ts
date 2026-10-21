// Kept in one place so every modal/editor uses the same input language as the customer account pages.
export const FIELD_LABEL = "ui-label";
// `rounded-none` is a deliberate override: bare <select> elements pick up daisyUI's default corner radius otherwise.
export const FIELD_INPUT =
    "ui-input";
export const FIELD_TEXTAREA = `${FIELD_INPUT} resize-none leading-relaxed`;
export const FIELD_ERROR = "ui-error";
export const FIELD_INPUT_INVALID = "ui-input-invalid";

export const BTN_PRIMARY = "ui-btn ui-btn-primary";
// `h-11` (not padding-driven) so this lines up with FILTER_SELECT/SearchField — a <select>'s native chrome renders taller at identical padding.
export const BTN_ADD = "ui-btn ui-btn-sm ui-btn-accent";
// Hovers blue, not pink: pink-btn is reserved for primary CTAs (BTN_ADD) per the brand's color rules.
export const BTN_SECONDARY = "ui-btn ui-btn-secondary ui-btn-sm";

// h-11/w-11 (44px) is the minimum touch target; these sat at h-8 (32px) before that rule landed.
export const ICON_BTN = "flex h-11 w-11 flex-none items-center justify-center rounded-full text-ink transition hover:bg-off";
export const ICON_BTN_DANGER = "flex h-11 w-11 flex-none items-center justify-center rounded-full text-alert transition hover:bg-alert/5";

// bg-white plus a hairline border (not a filled pill) keeps the same flat, chrome-free control language as the rest of the admin surface.
export const FILTER_SELECT = "admin-select h-11 rounded-none border border-ink/10 bg-white pl-3.5 pr-8 text-meta text-ink outline-none transition focus:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1";

// Breaks a section out of the root layout's px-8 padding to run edge-to-edge; `4rem` assumes that padding is exactly 2rem on both sides.
export const FULL_BLEED = "-mx-[var(--gutter)] w-[calc(100%+var(--gutter)*2)]";

export const BTN_HEADER_ACTION = "ui-btn ui-btn-secondary ui-btn-sm";

// BulkActionBar's own buttons sit on its dark navy bar and need their own white-on-transparent language; don't fold DANGER and SECONDARY into one "outline" class.
export const BTN_BULK_PRIMARY = "flex h-9 items-center bg-white px-4 text-meta font-semibold text-navy transition hover:bg-off";
export const BTN_BULK_DANGER = "flex h-9 items-center bg-alert px-4 text-meta font-semibold text-white transition hover:brightness-110";
export const BTN_BULK_SECONDARY = "flex h-9 items-center bg-white px-4 text-meta font-semibold text-navy transition hover:bg-off";

// Shared by every list table (ListPanel) so header and cell treatment match across the admin.
export const TABLE_HEAD_ROW = "bg-off/50";
export const TABLE_TH = "whitespace-nowrap border-b border-ink/10 px-5 py-3.5 text-left font-mono text-label tracking-[.12em] text-grey uppercase";
export const TABLE_TD = "border-b border-ink/10 px-5 py-3.5";
// Form panel: fields in a body, actions in a right-aligned footer strip (Change Password, Shipping, Discount Codes).
export const FORM_PANEL = "border border-ink/10 bg-white";
export const FORM_PANEL_FOOTER = "flex items-center justify-end border-t border-ink/10 bg-off/40 px-6 py-4 sm:px-7";

// After a failed submit, move focus to the first invalid field so keyboard and screen-reader users land on the problem.
// `scopeId` (a form id) keeps the search inside one modal so it can't land on a field behind it.
export function focusFirstInvalid(scopeId?: string) {
    requestAnimationFrame(() => {
        const root = (scopeId ? document.getElementById(scopeId) : null) ?? document;
        root.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus();
    });
}
