import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4300', locale: 'en-US' },
  webServer: {
    command: 'node scripts/serve.mjs 4300',
    cwd: '..',
    url: 'http://localhost:4300',
    reuseExistingServer: true,
  },
});
