/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* tailwind.config.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          700: "#27272a",
          800: "#18181b",
          900: "#09090b",
        },

        silver: {
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
        },

        gold: {
          200: "#fef3c7",
          300: "#fde68a",
          400: "#facc15",
          500: "#d4af37",
          600: "#b8860b",
        },

        diamond: {
          300: "#bae6fd",
          400: "#7dd3fc",
          500: "#38bdf8",
        },

        amethyst: {
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
        },

        torch: {
          400: "#fb923c",
          500: "#f97316",
        },

        ruby: {
          400: "#f87171",
          500: "#ef4444",
        },

        emerald: {
          400: "#34d399",
          500: "#10b981",
        },

        surface: {
          DEFAULT: "#09090b",
          raised: "#18181b",
          hover: "#242428",
          border: "#3f3f46",
          gold: "#3a2f16",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        fantasy: ["Cinzel", "Georgia", "serif"],
      },

      boxShadow: {
        "gold-soft": "0 0 12px rgba(212, 175, 55, 0.28)",
        "gold-button": "0 0 18px rgba(212, 175, 55, 0.35)",
        "diamond-soft": "0 0 14px rgba(125, 211, 252, 0.28)",
      },

      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;