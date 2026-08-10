import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': root.replace(/\/$/, ''),
      // The unit suite exercises pure logic, so the server-only guard that these
      // modules import is stubbed rather than pulling in a Next.js runtime.
      'server-only': `${root}tests/stubs/server-only.ts`,
    },
  },
});
