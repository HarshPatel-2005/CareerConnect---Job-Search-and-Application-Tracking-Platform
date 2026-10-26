const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/browser',
    timeout: 90000,
    expect: { timeout: 10000 },
    workers: 1,
    reporter: 'list',
    use: { baseURL: 'http://localhost:3100', channel: process.platform === 'win32' ? 'msedge' : undefined, actionTimeout: 15000, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }
    ],
    webServer: { command: 'node src/api/server.js', url: 'http://localhost:3100/health', env: { PORT: '3100' }, reuseExistingServer: false }
});
