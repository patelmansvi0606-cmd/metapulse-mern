import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.js"],
  },
  server: {
    port: 5173,
    proxy: {
      // Lets the dev server proxy API calls same-origin, avoiding CORS
      // entirely in local dev; production serves the API from its own
      // origin and relies on the CORS config in apps/api instead.
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
