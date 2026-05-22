import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,   // permite acesso por IP no Termux/rede local
    open: false,  // não tenta abrir browser automaticamente no Termux
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // Evita falha de build por chunk muito grande
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Separa vendors grandes para evitar timeout no Vercel
        manualChunks: {
          "react-vendor":    ["react", "react-dom", "react-router-dom"],
          "framer":          ["framer-motion"],
          "charts":          ["recharts"],
          "supabase":        ["@supabase/supabase-js"],
          "icons":           ["lucide-react"],
        },
      },
    },
  },
});
