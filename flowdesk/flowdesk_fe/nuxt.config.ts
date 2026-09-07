import { definePreset } from "@primevue/themes";
import Aura from "@primevue/themes/aura";

const FlowdeskPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        primary: {
          color: "#0f172a",
          inverseColor: "#ffffff",
          hoverColor: "#1e293b",
          activeColor: "#334155",
        },
        highlight: {
          background: "#0f172a",
          focusBackground: "#1e293b",
          color: "#ffffff",
          focusColor: "#ffffff",
        },
      },
      dark: {
        primary: {
          color: "{slate.200}",
          inverseColor: "{slate.900}",
          hoverColor: "{slate.100}",
          activeColor: "{slate.300}",
        },
        highlight: {
          background: "{slate.200}",
          focusBackground: "{slate.300}",
          color: "{slate.900}",
          focusColor: "{slate.900}",
        },
      },
    },
  },
});

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxtjs/tailwindcss", "@primevue/nuxt-module", "@pinia/nuxt"],

  imports: {
    dirs: ["utils/**"],
  },

  primevue: {
    options: {
      ripple: true,
      unstyled: false,
      theme: {
        preset: FlowdeskPreset,
        options: {
          prefix: "p",
          darkModeSelector: ".dark",
          cssLayer: false,
        },
      },
    },
    autoImport: true,
  },

  css: ["primeicons/primeicons.css", "~/assets/css/main.css"],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:8080",
      primeuiLicenseKey: process.env.NUXT_PUBLIC_PRIMEUI_LICENSE || "",
    },
  },
});
