// Run against a built sibling desktop checkout. No personal profile or live runtime is used.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');

const appRoot = path.resolve(process.argv[2] || path.join(__dirname, '../../otterdesk-desktop-app'));
const siteRoot = path.resolve(__dirname, '..');
const requireApp = createRequire(path.join(appRoot, 'package.json'));
const { _electron: electron, expect } = requireApp('@playwright/test');

async function main() {
  await fs.access(path.join(appRoot, 'dist/index.html'));
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'otterdesk-docs-'));
  const output = path.join(siteRoot, 'public/images/app');
  let app;
  try {
    const mockDir = path.join(profile, 'mockup');
    const blueprintDir = path.join(profile, 'blueprints');
    await fs.cp(path.join(appRoot, 'mockup'), mockDir, { recursive: true });
    await fs.mkdir(blueprintDir);
    await fs.writeFile(path.join(blueprintDir, 'index.json'), '[]');
    await fs.mkdir(output, { recursive: true });

    // Make the app's existing sample catalog useful for instructional screenshots.
    const catalogFile = path.join(mockDir, 'blueprints.json');
    const catalog = JSON.parse(await fs.readFile(catalogFile, 'utf8'));
    for (const blueprint of catalog.blueprints) {
      blueprint.description = blueprint.summary;
      blueprint.product = {
        agent_role: blueprint.tagline,
        input: (blueprint.config_fields || []).filter((field) => field.required).map((field) => field.label).join(', '),
        output: blueprint.summary,
        how_it_works: 'Uses the configured inputs to complete its mission. Review its activity and evidence before deciding what to do next.',
      };
    }
    await fs.writeFile(catalogFile, JSON.stringify(catalog));

    // Sample history exercises the real Performance UI; values are explicitly demo data.
    const fixturePath = path.join(profile, 'documentation-fixture.cjs');
    await fs.writeFile(fixturePath, `
      const mocks = require(${JSON.stringify(path.join(appRoot, 'mockup/worker-blueprints.js'))});
      const create = mocks.createMockWorkerBlueprintService;
      mocks.createMockWorkerBlueprintService = (options) => {
        const service = create(options);
        return { ...service, async getWorkerAnalysis(id) {
          const result = await service.getWorkerAnalysis(id);
          return { ...result,
            runs: { total: 12, successful: 10, failed: 1, cancelled: 0, running: 1, paused: 0, other: 0, success_rate: 10 / 11 },
            running_time: { total_ms: 7200000, measured_runs: 12, total_runs: 12, complete: true },
            tokens: { input_tokens: 48000, output_tokens: 12000, total_tokens: 60000, estimated_tokens: 0, measured_runs: 12, total_runs: 12, complete: true }
          };
        }};
      };
    `);

    const env = {
      ...process.env,
      NODE_ENV: 'test',
      OTTERDESK_MOCK_DATA: '1',
      OTTERDESK_MOCK_DATA_DIR: mockDir,
      OTTERDESK_DISABLE_MIRROR_NEURON_AUTO_INSTALL: '1',
      OTTERDESK_TEST_USER_DATA_DIR: profile,
      OTTERDESK_LOG_DIR: path.join(profile, 'logs'),
      MN_BLUEPRINT_SOURCE: 'local',
      MN_BLUEPRINT_LOCAL: blueprintDir,
      MN_WORKSPACE_ROOT: path.join(profile, 'runtime'),
      MN_HOME: path.join(profile, '.mn'),
    };
    delete env.ELECTRON_RUN_AS_NODE;
    app = await electron.launch({
      args: [
        '-r', path.join(appRoot, 'test/e2e/fixtures/disconnected-network.cjs'),
        '-r', path.join(appRoot, 'test/e2e/fixtures/isolated-credentials.cjs'),
        '-r', fixturePath,
        '.',
      ],
      cwd: appRoot,
      env,
      timeout: 30000,
    });
    const page = await app.firstWindow();
    page.setDefaultTimeout(15000);
    await page.waitForLoadState('domcontentloaded');
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1440, 960));
    const shot = async (name) => {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(output, `${name}.png`), animations: 'disabled' });
      console.log(`Captured ${name}.png`);
    };
    const dismissHireNotice = async () => {
      const button = page.getByRole('button', { name: 'Dismiss Portfolio Crash Stress Lab is on your team', exact: true });
      if (await button.isVisible()) await button.click();
    };

    await expect(page.getByText('Hire a co-worker to get started.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Hire a co-worker', exact: true }).first().click();
    await expect(page.getByPlaceholder('Search co-workers')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hire Portfolio Crash Stress Lab', exact: true })).toBeVisible();
    await shot('hire-catalog');
    await page.getByRole('button', { name: 'Hire Portfolio Crash Stress Lab', exact: true }).click();
    const openChat = page.getByRole('button', { name: 'Open conversation with Portfolio Crash Stress Lab', exact: true });
    await expect(openChat).toBeVisible({ timeout: 20000 });
    await openChat.click();
    const answer = page.getByRole('textbox', { name: 'Answer Portfolio Symbols', exact: true });
    await expect(answer).toBeVisible();
    await dismissHireNotice();
    await answer.fill('AAPL, MSFT, NVDA');
    await shot('chat-setup');
    await page.getByRole('button', { name: 'Use this answer', exact: true }).click();
    await expect(page.getByText('Your co-worker has started.', { exact: true })).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'View details for Portfolio Crash Stress Lab', exact: true }).click();
    await page.getByRole('tab', { name: 'Status', exact: true }).click();
    await expect(page.getByText('Intake evidence', { exact: true }).first()).toBeVisible();
    await shot('status');
    await page.getByRole('tab', { name: 'Configure', exact: true }).click();
    await expect(page.getByText('Saved changes apply to the next run.', { exact: true })).toBeVisible();
    await shot('configure');
    await page.getByRole('tab', { name: 'Shifts', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit schedule Portfolio Crash Stress Lab', exact: true })).toBeVisible();
    await shot('shifts');
    await page.getByRole('button', { name: 'My Team', exact: true }).first().click();
    await expect(page.getByRole('article', { name: 'Portfolio Crash Stress Lab performance', exact: true })).toContainText('Total runs');
    await shot('my-team');
    await openChat.click();
    await page.getByRole('textbox', { name: 'Ask this co-worker', exact: true }).fill('What are you responsible for?');
    await page.getByRole('button', { name: 'Send message to Portfolio Crash Stress Lab', exact: true }).click();
    await expect(page.getByRole('log', { name: 'Conversation messages', exact: true }).getByText(/I’m focused on the current run\. Please ask me again when this run finishes\.|This is sample data\. A deterministic mock result is ready for review\./)).toBeVisible({ timeout: 20000 });
    await shot('chat');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('radio', { name: 'Light', exact: true }).click();
    await shot('settings');
    await page.getByText('Backup and restore', { exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Co-worker to back up', exact: true })).toContainText('Portfolio Crash Stress Lab');
    await page.getByRole('button', { name: 'Restore and start from ZIP', exact: true }).scrollIntoViewIfNeeded();
    await shot('backup-and-restore');
    await page.getByRole('tab', { name: 'Resources', exact: true }).click();
    await expect(page.getByText('CPU capacity', { exact: true })).toBeVisible();
    await shot('resources');
    let commit = 'unavailable';
    let dirty = null;
    try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: appRoot, encoding: 'utf8' }).trim(); dirty = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: appRoot, encoding: 'utf8' }).trim()); } catch { /* Source archives need no Git. */ }
    await fs.writeFile(path.join(output, 'capture.json'), JSON.stringify({
      capturedAt: new Date().toISOString(),
      desktopCommit: commit,
      desktopDirty: dirty,
      desktopVersion: requireApp('./package.json').version,
      platform: process.platform,
      window: { width: 1440, height: 960 },
      data: 'Isolated mock-data mode with sample catalog metadata and performance history. No live runtime, personal documents, or real credentials.',
    }, null, 2) + '\n');
  } finally {
    if (app) await app.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
