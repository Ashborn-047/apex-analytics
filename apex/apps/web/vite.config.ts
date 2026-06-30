import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// VITE_BASE_URL is set to '/apex-analytics/' in the GitHub Pages deploy workflow.
// Locally it defaults to '/' so dev mode works without any config.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.VITE_BASE_URL ?? "/",
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
          target: env.VITE_ML_SERVICE_URL ?? "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core — always needed, load first
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            // Recharts is large (~400 kB); only needed on data pages
            "vendor-recharts": ["recharts"],
          },
        },
      },
    },
  };
});
