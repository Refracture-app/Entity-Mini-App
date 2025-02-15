import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace this with your repository name
const repositoryName = "your-repo-name"

export default defineConfig({
  base: `/${repositoryName}/`,
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
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