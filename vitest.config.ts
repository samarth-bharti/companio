// vitest.config.ts — unit/route tests for the backend.
// resolve.tsconfigPaths resolves the "@/..." alias the same way Next does.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
