/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // DEFAULT / dark are unchanged so every existing `bg-brand`,
        // `text-brand`, `bg-brand-dark` keeps working.
        brand: {
          DEFAULT: "#4F46E5",
          dark: "#4338CA",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          600: "#4F46E5",
          700: "#4338CA",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        pop: "0 10px 30px -8px rgb(15 23 42 / 0.25)",
      },
      maxWidth: {
        page: "1600px",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "scale-in": {
          from: { opacity: 0, transform: "translateY(6px) scale(0.98)" },
          to: { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(24px)", opacity: 0 },
          to: { transform: "translateX(0)", opacity: 1 },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "scale-in": "scale-in 180ms ease-out",
        "slide-in-right": "slide-in-right 220ms ease-out",
      },
    },
  },
  plugins: [],
};
