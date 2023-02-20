import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from "url";
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
// https://stackoverflow.com/questions/66043612/vue3-vite-project-alias-src-to-not-working
export default defineConfig({
  plugins: [
    react(),
    { // default settings on build (i.e. fail on error)
      ...eslint(),
      apply: 'build',
    },
    { // do not fail on serve (i.e. local development)
      ...eslint({
        failOnWarning: false,
        failOnError: false,
      }),
      apply: 'serve',
      enforce: 'post'
  }],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@cmp', replacement: fileURLToPath(new URL('./src/components', import.meta.url)) },
    ],
  },
})
