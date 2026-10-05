import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import ScrollToTop from "@/components/layout/ScrollToTop";
import ConditionalModalRoot from "@/components/modals/ConditionalModalRoot";
import ConditionalPromoBanner from "@/components/layout/ConditionalPromoBanner";
import PageContentFrame from "@/components/layout/PageContentFrame";
import { StoreProvider } from "@/library/store";
import { ProductsProvider } from "@/library/productsStore";
import { fetchCatalog } from "@/library/api/products";
import { fetchContent } from "@/library/api/content";
import { ContentProvider } from "@/library/content";
import { PROMOS } from "@/library/admin/content";
import { SITE_URL } from "@/library/siteConfig";
import "./globals.css";

// Matches PromoBanner's fixed h-10 (PROMO_BANNER_HEIGHT there) — kept in sync manually across files.
const PROMO_BANNER_HEIGHT = "2.5rem";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Cindyrella", template: "%s | Cindyrella" },
  description: "Skincare built around a considered routine, not a haul — cleanse, treat, moisturize.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [catalog, content] = await Promise.all([fetchCatalog(), fetchContent()]);
  // Pre-seeds --promo-h at the server so the first paint reserves banner space, avoiding a client-side layout jump.
  const hasActivePromo = PROMOS.some((p) => p.active);

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
      style={{ "--promo-h": hasActivePromo ? PROMO_BANNER_HEIGHT : "0px" } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        <ProductsProvider initial={catalog}>
        <StoreProvider>
        <ContentProvider initial={content}>
          <ScrollToTop />
          <ConditionalPromoBanner />
          <ConditionalNavbar />
          <PageContentFrame>{children}</PageContentFrame>
          <ConditionalFooter />
          <ConditionalModalRoot />
          <Toaster
            position="top-center"
            icons={{
              success: (
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success text-white">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
              ),
              error: (
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-alert text-white">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </span>
              ),
            }}
            style={
              {
                "--normal-bg": "#ffffff",
                "--normal-border": "rgba(18,35,58,0.1)",
                "--normal-text": "#12233A",
                "--success-bg": "#ffffff",
                "--success-border": "rgba(34,122,76,0.3)",
                "--success-text": "#12233A",
                "--error-bg": "#ffffff",
                "--error-border": "rgba(150,47,82,0.3)",
                "--error-text": "#12233A",
              } as React.CSSProperties
            }
            toastOptions={{
              style: {
                borderRadius: 0,
                boxShadow: "0 24px 60px rgba(61,90,115,.22)",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "13px",
              },
            }}
          />
        </ContentProvider>
        </StoreProvider>
        </ProductsProvider>
      </body>
    </html>
  );
}
