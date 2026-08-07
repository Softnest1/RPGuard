import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import viteCompression from "vite-plugin-compression";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";

// SECURITY_HEADERS limitait l'utilisation de l'appli en mode Iframe. 
// Pour permettre l'aperçu mobile dans l'interface MeDo, nous désactivons 
// provisoirement CSP en dev. Il devra être configuré côté serveur en production.
const SECURITY_HEADERS = {};

// 🚀 Configuration Ultime & Optimisée pour RPGuard (Adaptée 100% React)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      svgr({
        svgrOptions: {
          icon: true,
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
      viteCompression({ algorithm: "gzip", ext: ".gz", disable: process.env.NODE_ENV !== 'production' }),
      viteCompression({ algorithm: "brotliCompress", ext: ".br", disable: process.env.NODE_ENV !== 'production' }),
      visualizer({ filename: "stats.html", open: false }) as any,
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // ⚡ Optimisation du Build et découpage intelligent des fichiers
    build: {
      target: 'esnext',
      sourcemap: true,
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Ajout d'un hash basé sur un timestamp dans les noms de fichiers pour forcer le téléchargement 
          // des nouveaux fichiers JS/CSS et briser le cache agressif (surtout mobile Chrome).
          entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
          manualChunks(id: string) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
              return 'vendor-router';
            }
            if (id.includes('node_modules/@supabase/')) {
              return 'vendor-supabase';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/@radix-ui/')) {
              return 'vendor-ui';
            }
          },
        },
      },
    },
    // 🌐 Configuration Serveur optimisée
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
      cors: true,
      hmr: {
        clientPort: 443,
        overlay: false, // Empêche les fenêtres d'erreur de bloquer l'écran
      },
      headers: SECURITY_HEADERS,
      // Proxy intelligent Supabase Edge Functions
      ...(env.VITE_SUPABASE_URL ? {
        proxy: {
          '/functions/v1': {
            target: env.VITE_SUPABASE_URL,
            changeOrigin: true,
            secure: true,
          }
        }
      } : {})
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
      cors: true,
      headers: SECURITY_HEADERS,
    },
    // 🧠 Pré-compilation pour accélérer le démarrage
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
    }
  };
});
