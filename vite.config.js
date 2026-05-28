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
      "/getToken": "http://127.0.0.1:3000",
      "/token": "http://127.0.0.1:3000",
      "/stream": "http://127.0.0.1:3000",
      "/moderate": "http://127.0.0.1:3000",
      "/audit": "http://127.0.0.1:3000",
      "/health": "http://127.0.0.1:3000",
    },
  },
});
