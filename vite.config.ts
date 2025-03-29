import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  publicDir: path.resolve(__dirname, "public"),
  optimizeDeps: {
    include: ['react-quill']
  },
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    // SSR için derlemeyi devre dışı bırak (Vercel/Netlify için)
    ssr: false,
    // Statik site dağıtımı için
    target: 'esnext',
    // Build sonrası dosyaları görüntüle (debug için)
    reportCompressedSize: true,
  }
});