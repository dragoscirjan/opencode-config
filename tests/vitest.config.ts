import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks', // Use forks instead of threads for better stability with spawned child processes
    // OpenCode agent runs can take a long time to generate responses
    testTimeout: 600000, // 10 minutes per test
    hookTimeout: 60000,  // 1 minute for beforeEach/afterEach hooks
  },
});