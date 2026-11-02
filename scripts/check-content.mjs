import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { legacyDocRoutes } from '../lib/legacy-routes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content/docs');
const files = (await fs.readdir(contentDir)).filter((file) => file.endsWith('.mdx'));
const slugs = new Set(files.map((file) => file === 'index.mdx' ? '' : file.slice(0, -4)));
const meta = JSON.parse(await fs.readFile(path.join(contentDir, 'meta.json'), 'utf8'));
const ordered = meta.pages.filter((item) => !item.startsWith('---'));
assert.equal(new Set(ordered).size, ordered.length, 'Duplicate page in navigation');
assert.deepEqual(new Set(ordered.map((slug) => slug === 'index' ? '' : slug)), slugs,
  'Every guide must appear exactly once in navigation');

let screenshots = 0;
for (const file of files) {
  const text = await fs.readFile(path.join(contentDir, file), 'utf8');
  assert.match(text, /^---\ntitle: .+\ndescription: .+\n---\n/, `${file}: missing frontmatter`);
  assert.ok(!/^# /m.test(text), `${file}: duplicate H1 (DocsTitle supplies it)`);
  assert.ok(!/\bTest now\b|\bPause test\b|\bQuick testing\b/.test(text), `${file}: retired UI instructions`);
  for (const match of text.matchAll(/\]\((\/docs(?:\/[a-z0-9-]+)?)(?:#[^)]+)?\)/g)) {
    const slug = match[1].replace(/^\/docs\/?/, '');
    assert.ok(slugs.has(slug), `${file}: broken or non-canonical link ${match[1]}`);
  }
  for (const match of text.matchAll(/<AppScreenshot\s+src="([^"]+)"\s+alt="([^"]+)"\s+caption="([^"]+)"\s*\/>/g)) {
    assert.ok(match[2].length > 20, `${file}: screenshot needs useful alt text`);
    await fs.access(path.join(root, 'public', match[1]));
    screenshots++;
  }
}
for (const [oldSlug, newSlug] of Object.entries(legacyDocRoutes)) {
  assert.ok(!slugs.has(oldSlug), `Redirect shadows a current guide: ${oldSlug}`);
  assert.ok(slugs.has(newSlug), `Missing redirect destination: ${oldSlug} -> ${newSlug}`);
}
console.log(`Checked ${files.length} guides, navigation, links, ${screenshots} screenshot embeds, and ${Object.keys(legacyDocRoutes).length} legacy routes.`);
