import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      },
      "/ws": {
        target: "ws://localhost:5000",
        ws: true
      },
      "/ai": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, "")
      },
      "/ebooks": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});
