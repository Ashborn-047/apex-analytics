/// <reference types="vite/client" />

export const API_BASE = import.meta.env.PROD
  ? "https://apex-f1-ml.fly.dev"
  : "";
