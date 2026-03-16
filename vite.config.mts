import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: { ignored: ["**/vendor/**", "**/contracts/**"] },
  },
  optimizeDeps: {
    entries: ["index.html"],
  },
});
