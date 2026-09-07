import type { Config } from "tailwindcss";

export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        inter: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        fd: {
          bg: "#eef2f6",
          surface: "#ffffff",
          primary: "#0f172a",
          muted: "#64748b",
          border: "#e2e8f0",
          success: "#22c55e",
        },
      },
      borderRadius: {
        "2.5xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        fd: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 32px rgba(15, 23, 42, 0.06)",
        "fd-card": "0 1px 3px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
