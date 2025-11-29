
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Resolve the API Key with priority:
  // 1. VITE_API_KEY (Standard for Vite apps on Vercel/Netlify)
  // 2. API_KEY (Fallback)
  // Check both 'env' (loaded files) and 'process.env' (system variables)
  const apiKey = env.VITE_API_KEY || env.API_KEY || process.env.VITE_API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
    },
    define: {
      // Properly inject the process.env object with the API Key
      // This avoids conflicts between defining 'process.env' and 'process.env.API_KEY' separately
      'process.env': JSON.stringify({
        API_KEY: apiKey,
        NODE_ENV: mode,
      }),
    },
  };
});
