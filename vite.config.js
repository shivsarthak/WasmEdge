import { defineConfig } from 'vite';
const prefix = `monaco-editor/esm/vs`;
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        loading: resolve(__dirname, 'loading.html'),
        complete: resolve(__dirname, 'complete.html'),
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});