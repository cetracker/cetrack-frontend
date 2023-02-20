import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from "url";
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
// https://stackoverflow.com/questions/66043612/vue3-vite-project-alias-src-to-not-working
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@cmp', replacement: fileURLToPath(new URL('./src/components', import.meta.url)) },
    ],
  },
})
