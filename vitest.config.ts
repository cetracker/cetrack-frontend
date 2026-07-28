import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('test'),
    __BUILD_TIME__: JSON.stringify('2026-01-01T00:00:00.000Z'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // vmThreads reuses one VM per worker instead of forking a process per file, but keeps a
    // fresh module registry — so vi.mock still works, unlike `isolate: false`. Suite 204s -> 128s.
    pool: 'vmThreads',
    // vitest 4 removed environmentMatchGlobs. DOM tests opt in with a
    // `// @vitest-environment jsdom` docblock on line 1 — required for new .test.tsx files.
    // The slowest test (MountAssemblyDialog, 5 MUI dialog interactions) costs 4.3s alone but
    // 14-16s with all workers saturated. 45s keeps ~3x headroom on a busy machine.
    // If it still flakes, `npm run test -- --maxWorkers=4` trades ~17% wall clock for headroom.
    testTimeout: 45000,
    // Prebundle MUI/react once with esbuild instead of re-resolving them for each
    // isolated test file — the dominant cost of the suite.
    deps: { optimizer: { client: { enabled: true } } },
    setupFiles: ['./src/setupTests.ts'],
  },
})
