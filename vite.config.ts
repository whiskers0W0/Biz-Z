import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  root: "client",
  envDir: "..",
  build: { outDir: "../dist", emptyOutDir: true },
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    proxy: {
      // Preserve the browser host so the API can verify same-origin writes.
      "/api": { target: process.env.API_TARGET || "http://127.0.0.1:3001", changeOrigin: false },
    },
  },
});
