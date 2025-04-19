import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from "url";
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint2';
import mockDevServerPlugin from 'vite-plugin-mock-dev-server'; // https://github.com/pengzhanbo/vite-plugin-mock-dev-server

// https://vitejs.dev/config/
// https://stackoverflow.com/questions/66043612/vue3-vite-project-alias-src-to-not-working
export default defineConfig({
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '^/mock/api': {
        target: ''
      },
    },
    logLevel: 'debug',
  },
  plugins: [
    react(),
    { // default settings on build (i.e. fail on error)
      ...eslint(),
      apply: 'build',
    },
    {
      apply: 'serve',
      enforce: 'post'
    },
    // mockDevServerPlugin(),
    {
      // restricting to serve doesn't work
      ...mockDevServerPlugin({
        include: 'mock/**/*.mock.{ts,js,cjs,mjs,json,json5}'
      }),
      apply: 'serve',
      enforce: 'post'
    },
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@cmp', replacement: fileURLToPath(new URL('./src/components', import.meta.url)) },
    ],
  },
})
