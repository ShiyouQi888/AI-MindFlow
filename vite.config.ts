import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    server: {
      host: "::",
      port: 5173,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY),
      'import.meta.env.VITE_DEEPSEEK_API_KEY': JSON.stringify(env.VITE_DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY),
      'import.meta.env.VITE_DEEPSEEK_BASE_URL': JSON.stringify(env.VITE_DEEPSEEK_BASE_URL || process.env.VITE_DEEPSEEK_BASE_URL),
      'import.meta.env.VITE_DEEPSEEK_MODEL': JSON.stringify(env.VITE_DEEPSEEK_MODEL || process.env.VITE_DEEPSEEK_MODEL),
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tooltip'],
          },
        },
      },
    },
  };
});
