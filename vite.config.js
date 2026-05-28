/**
 * Vite config - dev server proxies API requests to the backend.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/getToken": "https://karthik-project.onrender.com",
      "/token": "https://karthik-project.onrender.com",
      "/stream": "https://karthik-project.onrender.com",
      "/moderate": "https://karthik-project.onrender.com",
      "/audit": "https://karthik-project.onrender.com",
      "/health": "https://karthik-project.onrender.com",
    },
  },
});
