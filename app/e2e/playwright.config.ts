import { defineConfig } from '@playwright/test';

const port = process.env['PORT'] ?? '4300';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  reporter: 'list',
  retries: process.env['CI'] ? 1 : 0, // a shared runner is slower than this machine: one retry, never a silent pass

  use: { baseURL: `http://localhost:${port}`, locale: 'en-US' },
  webServer: {
    command: `node scripts/serve.mjs ${port}`,
    cwd: '..',
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
  },
});
