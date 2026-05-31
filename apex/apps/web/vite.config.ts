import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// VITE_BASE_URL is set to '/apex-analytics/' in the GitHub Pages deploy workflow.
// Locally it defaults to '/' so dev mode works without any config.
export default defineConfig({
  base: process.env.VITE_BASE_URL ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_ML_SERVICE_URL ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
