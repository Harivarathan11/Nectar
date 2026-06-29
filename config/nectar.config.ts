import { PlaywrightTestConfig, ReporterDescription } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const getReporterDescription = (): Array<ReporterDescription> => {
  if (process.env.ENABLE_LOGS === 'true') {
    return [['list', { printSteps: true }], ['html', { open: 'never' }]];
  }

  return [['../src/cliReporterWithSteps.ts'], ['html', { open: 'never' }]];
};

const config: PlaywrightTestConfig = {
  timeout: 3 * 60 * 1000,
  retries: 0,
  testDir: '../tests/nectar',
  workers: 1,
  reporter: getReporterDescription(),
  use: {
    headless: true,
    browserName: 'chromium',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 30000,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on',
  },
  expect: {
    timeout: 30000,
  },
  projects: [
    {
      name: 'Chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'WebKit',
      use: { browserName: 'webkit' },
    },
  ],
  globalSetup: '../globalSetup.ts',
};

export default config;
