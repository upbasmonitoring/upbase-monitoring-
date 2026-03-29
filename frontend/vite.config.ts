import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@amcharts')) return 'globe-engine';
          if (id.includes('framer-motion')) return 'animations';
          if (id.includes('lucide-react')) return 'ui-icons';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
    assetsInlineLimit: 0, // Ensure all assets are properly output to files
    outDir: "dist", // Ensure output directory is correct
    target: "esnext", // Ensure modern JavaScript output
  },
}));
