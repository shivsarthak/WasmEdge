import { defineConfig } from 'vite';
const prefix = `monaco-editor/esm/vs`;

export default defineConfig({
  build: {
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});