/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* vite.config.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42be                +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis         #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis        ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    alias: {
      "@ft/shared": path.resolve(__dirname, "../shared/src/index.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Point to TS source so Vite transforms it natively — the CJS dist
      // served via @fs doesn't expose named exports to the browser.
      "@ft/shared": path.resolve(__dirname, "../shared/src/index.ts"),
      // Phaser's `module` field (phaser.esm.js) has no default export.
      // Alias to the UMD dist so esbuild synthesises a proper default.
      phaser: path.resolve(__dirname, "../node_modules/phaser/dist/phaser.js"),
    },
  },
  optimizeDeps: {
    include: ["phaser"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
