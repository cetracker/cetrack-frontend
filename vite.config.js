import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from "url";
import { defineConfig } from 'vite';
import mockDevServerPlugin from 'vite-plugin-mock-dev-server' // https://github.com/pengzhanbo/vite-plugin-mock-dev-server
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
// https://stackoverflow.com/questions/66043612/vue3-vite-project-alias-src-to-not-working
export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '^/api': {
        target: '',
      },
    },
  },
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
    },
    mockDevServerPlugin({
      include: 'mock/**/*.mock.{ts,js,cjs,mjs,json,json5}'
    }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@cmp', replacement: fileURLToPath(new URL('./src/components', import.meta.url)) },
    ],
  },
})
