# OtterDesk documentation

The user guide for the OtterDesk desktop app, built with Next.js and Fumadocs MDX. The public app links to [doc.otterdesk.app](https://doc.otterdesk.app).

## Run locally

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The root opens the guide at `/docs`. Use a Node version supported by the installed Next.js package.

## Validate changes

```bash
npm run check:content
npm run types:check
npm run build
```

`check:content` validates navigation coverage, canonical guide links, screenshot references and alt text, frontmatter, retired instructions, and legacy redirect destinations. `types:check` compiles MDX and checks the Next.js/TypeScript routes. `build` prerenders the guides, Markdown exports, and social images.

After building, use `npm start` to preview production output. Check a narrow viewport, keyboard navigation, search, a screenshot's full-size link, and an old URL such as `/docs/cli` (which redirects to `/docs/chat`). Search and machine-readable endpoints are `/api/search`, `/llms.txt`, `/llms-full.txt`, and `/llms.mdx/docs/<slug>/content.md`.

## Content organization

- `content/docs/*.mdx`: task-based user guides. Fumadocs supplies the page title, so begin content with prose or an H2 rather than a duplicate H1.
- `content/docs/meta.json`: ordered sidebar groups. Include every guide exactly once.
- `components/app-screenshot.tsx`: accessible screenshot figure, caption, and full-size image link.
- `public/images/app/`: screenshots and capture provenance. These are intentional documentation assets.
- `lib/legacy-routes.mjs`: old guide filenames mapped to canonical task URLs. `next.config.mjs` preserves rendered, root-alias, Markdown, and social-image addresses.
- `lib/shared.ts`: site name, route prefixes, and the documentation GitHub repository used by source links.

Keep instructions specific to the current app. Use sentence case and the product noun **co-worker**. Describe what an action saves, starts, pauses, or deletes. Avoid promising that a successful run certifies its conclusions, that all integrations stay offline, or that missing catalog data is a safety guarantee.

## Keep the guide aligned with the desktop app

The sibling `otterdesk-desktop-app` checkout is the owning source. Review its `SPEC.md`, `README.md`, and relevant renderer components and E2E tests before changing instructions. Current desktop behavior takes precedence over historical guide wording.

| Guide area | Owning desktop sources |
| --- | --- |
| Navigation and opening view | `src/renderer/src/app/components/app-sidebar.tsx`, `features/workers/pages/MyTeamPage.tsx` |
| Chat, setup, requested input | `features/workers/pages/WorkerChatPage.tsx`, conversation/setup components, `test/e2e/conversation-setup.spec.ts`, `conversation-input.spec.ts` |
| Details and configuration | `features/workers/pages/WorkerStatusPage.tsx`, `components/worker-status-tabs/` |
| Schedules | `features/workers/pages/ShiftsPage.tsx`, schedule hooks/helpers, runtime schedule contracts |
| Reports and evidence | conversation report/media components, `test/e2e/conversation-report.spec.ts`, report-specific tests |
| Performance and collaboration | `features/workers/performance/`, `features/collaboration/`, corresponding E2E tests |
| Settings, privacy, backups | `features/system/components/settings/`, `test/e2e/usage-settings.spec.ts`, `job-backups.spec.ts` |
| Runtime/models, account, credentials | main-process services/repositories and the desktop specification |

Renderer paths in this table are relative to `src/renderer/src/` unless they begin with `src/` or `test/`. Check main-process behavior when visible copy alone does not prove a setting works. Do not document placeholder preferences as completed native integrations.

When renaming a guide, add its old slug to `legacy-routes.mjs`; keep current internal links canonical. Do not restore the removed team-wide Shifts page, Test now/Pause test actions, or persisted Quick testing settings. The current setup flow can start work after the final required Chat answer; Configure remains save-only.

## Refresh screenshots

Prepare the desktop dependencies and renderer first, in its own checkout:

```bash
cd ../otterdesk-desktop-app
npm ci
npm run build
```

Then run from this repository, passing the desktop checkout explicitly if it is not a sibling:

```bash
npm run screenshots -- ../otterdesk-desktop-app
```

The capture script uses Playwright/Electron already declared by the desktop app. It needs a GUI-capable host. It launches the actual app at 1440 × 960 with:

- a temporary user-data profile, blueprint folder, logs, and copied JSON fixtures;
- `OTTERDESK_MOCK_DATA=1`, no real runtime/API/CLI calls, and the desktop E2E guards for network and legacy credentials;
- sample catalog descriptions and a small deterministic performance-history fixture;
- no live services, personal documents, or real passwords/tokens.

It captures catalog, guided setup, Chat, Configure, Status, Shifts, My Team, General, Backup and restore, and Resources. Screenshots retain the app's native controls; they are not generated mockups. Captions explicitly identify demonstration data. `public/images/app/capture.json` records the desktop commit/version, platform, window size, and capture time. Check the desktop working tree too: a commit hash alone does not describe uncommitted source changes.

Inspect every regenerated image. Confirm useful controls are visible, no loading placeholders obscure the instruction, no private information appears, and the guide's text still matches. The script cleans up its temporary profile and never modifies the desktop source or personal app data. Build outputs and dependency folders remain ignored.

## Publishing

This repository produces the documentation site; publishing is a separate deployment step. A local build or screenshot refresh does not publish changes.
