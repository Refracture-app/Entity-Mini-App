import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/fracture-gitcoin-fund-round/', // Update this to match your repository name
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure sourcemaps are generated
    sourcemap: true,
    // Configure the build
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Ensure assets are handled correctly
    assetsInlineLimit: 4096,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
    include: ['@lukso/up-provider', '@erc725/erc725.js', 'ethers']
  }
});
