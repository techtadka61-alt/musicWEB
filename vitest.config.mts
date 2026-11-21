import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { NEXT_PUBLIC_API_BASE_URL: 'http://api.test/api/v1' },
  },
});
