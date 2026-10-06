// Single source for the canonical origin — used by metadataBase, sitemap.ts, and robots.ts so they can't drift; placeholder until a domain is provisioned.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cindyrella.ph";
