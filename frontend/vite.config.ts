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
        manualChunks: {
          'ui-icons': ['lucide-react'],
          'charts': ['recharts'],
          'globe-engine': ['@amcharts/amcharts5', '@amcharts/amcharts5/map', '@amcharts/amcharts5/themes/Animated', '@amcharts/amcharts5-geodata/worldLow'],
          'animations': ['framer-motion'],
          'query-stack': ['@tanstack/react-query'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    assetsInlineLimit: 0, // Ensure all assets are properly output to files
    outDir: "dist", // Ensure output directory is correct
    target: "esnext", // Ensure modern JavaScript output
  },
}));
