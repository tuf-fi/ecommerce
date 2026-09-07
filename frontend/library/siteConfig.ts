// Single source for the site's canonical origin — used by metadataBase,
// sitemap.ts, and robots.ts so they can never drift out of sync with each
// other. No real domain is provisioned yet, hence the placeholder fallback.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cindyrella.ph";
