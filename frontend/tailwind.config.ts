/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* tailwind.config.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: evan-dro <evan-dro@student.42be              +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by evan-dro        #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by evan-dro       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ─── Deep-sea fantasy palette ─────────────────────────────────────
        abyss: {
          50:  "#e8eaf6",
          100: "#c5c9e8",
          200: "#9fa5d8",
          300: "#7780c8",
          400: "#5560bc",
          500: "#3340b0",
          600: "#2d39a9",
          700: "#2530a0",
          800: "#1c2897",
          900: "#101887",
        },
        deep: {
          50:  "#e0f2f1",
          100: "#b2dfdb",
          200: "#80cbc4",
          300: "#4db6ac",
          400: "#26a69a",
          500: "#009688",
          600: "#00897b",
          700: "#00796b",
          800: "#00695c",
          900: "#004d40",
        },
        coral: {
          400: "#ff7043",
          500: "#f4511e",
          600: "#e64a19",
        },
        // Neutral surface tones for the dark UI
        surface: {
          DEFAULT: "#0d1117",
          raised: "#161b22",
          border: "#21262d",
          muted:  "#30363d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        fantasy: ["Cinzel", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 12px 2px rgba(0, 150, 136, 0.45)",
        "glow-coral": "0 0 12px 2px rgba(244, 81, 30, 0.45)",
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
