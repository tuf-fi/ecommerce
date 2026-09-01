import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens resolve to CSS custom properties defined once in globals.css.
        // "navy" and "footer" are separate, always-solid dark-surface colors —
        // never flip, always pair with white text. Kept visually distinct so
        // the translucent scrolled navbar still reads as glass over the footer
        // instead of blending into a single flat block.
        ink: "var(--color-ink)",
        navy: "#0F2036",
        footer: "#1B1230",
        white: "var(--color-white)",
        grey: {
          DEFAULT: "var(--color-grey)",
          light: "var(--color-grey-light)",
        },
        off: "var(--color-off)",
        alert: "var(--color-alert)",
        pink: {
          DEFAULT: "var(--color-pink)",
          dark: "var(--color-pink-dark)",
          soft: "var(--color-pink-soft)",
          btn: "var(--color-pink-btn)",
          "btn-hover": "var(--color-pink-btn-hover)",
        },
        blue: {
          soft: "var(--color-blue-soft)",
        },
        gold: "var(--color-gold)",
        success: {
          DEFAULT: "var(--color-success)",
          dark: "var(--color-success-dark)",
        },
      },
      fontFamily: {
        // Load these via next/font/google in your root layout —
        // see the note below the config.
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      borderRadius: {
        // For badges/chips/tags/the toggle switch track — small status
        // indicators, not clickable CTAs. Buttons are flat (no radius
        // class at all), set per call site rather than through this token,
        // since the two need to diverge.
        pill: "100px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(61,90,115,.05)",
        "card-hover": "0 16px 28px rgba(61,90,115,.14)",
        modal: "0 24px 60px rgba(61,90,115,.22)",
        glow: "0 20px 50px rgba(61,90,115,.16)",
      },
      backgroundImage: {
        // The recurring diagonal placeholder/decorative gradient used
        // throughout the demo (product image placeholders, blobs, etc.)
        "pastel-diagonal": "linear-gradient(135deg, #E3F1F8, #F8D9E8)",
      },
      keyframes: {
        // Radix Accordion exposes the measured content height as this CSS
        // var — animating to/from it is how you get a real height transition
        // without hardcoding a max-height guess.
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.3s ease-out",
        "accordion-up": "accordion-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
