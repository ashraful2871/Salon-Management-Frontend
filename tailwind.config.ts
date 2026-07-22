import plugin from "tailwindcss/plugin";

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "oklch(97.32% 0.034 113.58)",
          100: "oklch(94.41% 0.037 107.68)",
          200: "oklch(88.73% 0.052 100.67)",
          300: "oklch(80.15% 0.083 95.58)",
          400: "oklch(71.05% 0.126 89.45)",
          500: "oklch(64.66% 0.153 81.54)",
          600: "oklch(56.21% 0.142 79.21)",
          700: "oklch(47.83% 0.128 77.15)",
          800: "oklch(39.45% 0.108 75.89)",
          900: "oklch(31.22% 0.085 74.63)",
          950: "oklch(23.45% 0.062 73.12)",
          DEFAULT: "oklch(64.66% 0.153 81.54)",
        },
        accent: {
          rose: "oklch(0.76 0.11 20)",
          "rose-light": "oklch(0.88 0.07 20)",
          sage: "oklch(0.58 0.05 150)",
          "sage-light": "oklch(0.88 0.04 150)",
          gold: "oklch(64.66% 0.153 81.54)",
          "gold-light": "oklch(83.54% 0.083 90.58)",
          "gold-dark": "oklch(54.6% 0.132 81.09)",
          DEFAULT: "oklch(0.76 0.11 20)",
        },
        cream: {
          50: "oklch(99% 0.01 113.58)",
          100: "oklch(97.32% 0.034 113.58)",
          200: "oklch(95% 0.035 110)",
          300: "oklch(92.89% 0.037 107.16)",
          400: "oklch(88% 0.04 105)",
          DEFAULT: "oklch(97.32% 0.034 113.58)",
        },
        charcoal: {
          50: "oklch(95% 0.005 93.06)",
          100: "oklch(85% 0.008 93.06)",
          200: "oklch(75% 0.012 93.06)",
          300: "oklch(65% 0.016 93.06)",
          400: "oklch(55% 0.02 93.06)",
          500: "oklch(46.95% 0.027 93.76)",
          600: "oklch(38% 0.022 93.06)",
          700: "oklch(27.25% 0.016 93.06)",
          800: "oklch(20% 0.012 93.06)",
          900: "oklch(15% 0.008 93.06)",
          DEFAULT: "oklch(27.25% 0.016 93.06)",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "1.1", fontWeight: "700" }],
        "display-lg": ["3.75rem", { lineHeight: "1.1", fontWeight: "700" }],
        display: ["3rem", { lineHeight: "1.2", fontWeight: "700" }],
        "heading-xl": ["2.25rem", { lineHeight: "1.25", fontWeight: "600" }],
        "heading-lg": ["1.875rem", { lineHeight: "1.3", fontWeight: "600" }],
        heading: ["1.5rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.5" }],
        tiny: ["0.625rem", { lineHeight: "1.5" }],
      },
      boxShadow: {
        soft: "0 4px 20px -4px oklch(44.51% 0.062 87.24 / 0.1)",
        card: "0 8px 30px -8px oklch(44.51% 0.062 87.24 / 0.12)",
        gold: "0 8px 25px -8px oklch(64.66% 0.153 81.54 / 0.35)",
        elevated: "0 20px 60px -12px oklch(0% 0 0 / 0.15)",
        "inner-glow": "inset 0 2px 4px 0 oklch(100% 0 0 / 0.06)",
        glow: "0 0 25px -5px oklch(64.66% 0.153 81.54 / 0.4)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px",
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".glass": {
          "backdrop-filter": "blur(16px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(16px) saturate(180%)",
          "background-color": "oklch(100% 0 0 / 0.6)",
          border: "1px solid oklch(0% 0 0 / 0.08)",
        },
        ".glass-dark": {
          "backdrop-filter": "blur(16px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(16px) saturate(180%)",
          "background-color": "oklch(0% 0 0 / 0.6)",
          border: "1px solid oklch(100% 0 0 / 0.1)",
        },
      });
    }),
  ],
};

export default config;
