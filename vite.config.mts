import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    watch: { ignored: ["**/vendor/**", "**/contracts/**"] },
  },
  optimizeDeps: {
    entries: ["index.html"],
  },
});
