#!/usr/bin/env node
// Refreshes data/dblp.snapshot.json, the copy the build falls back to when
// DBLP cannot be reached.
//
//   npm run update-papers            fetch and rewrite the snapshot
//   npm run update-papers -- --check try every source, report, write nothing

import { readFile, writeFile } from 'node:fs/promises';
import { fetchDblp, fetchSource, sources } from '../src/lib/dblp.js';

const SNAPSHOT = new URL('../data/dblp.snapshot.json', import.meta.url);
const CONFIG = new URL('../src/site.config.ts', import.meta.url);

// Read the pid from the site config without needing a TypeScript loader.
const pid = (await readFile(CONFIG, 'utf8')).match(/dblpPid:\s*'([^']+)'/)?.[1];
if (!pid) {
  console.error('dblpPid not found in src/site.config.ts');
  process.exit(1);
}

if (process.argv.includes('--check')) {
  let ok = 0;
  for (const src of sources(pid)) {
    try {
      const papers = await fetchSource(src, pid);
      console.log(`✓ ${src.name}: ${papers.length} records`);
      ok++;
    } catch (err) {
      console.log(`✗ ${src.name}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(ok ? `${ok} source(s) reachable` : 'no source reachable: the build will use the snapshot');
  process.exit(0);
}

const result = await fetchDblp(pid, { log: (m) => console.log(`  ${m}`) });
if (!result) {
  console.error('DBLP unreachable from every source; snapshot left unchanged.');
  process.exit(1);
}

const papers = result.papers.sort((a, b) => b.year - a.year || a.key.localeCompare(b.key));
const old = JSON.parse(await readFile(SNAPSHOT, 'utf8').catch(() => '{"papers":[]}'));
const oldKeys = new Set(old.papers.map((/** @type {{ key: string }} */ p) => p.key));
const added = papers.filter((p) => !oldKeys.has(p.key));

await writeFile(
  SNAPSHOT,
  JSON.stringify({ pid, source: result.source, fetchedAt: new Date().toISOString(), papers }, null, 2) + '\n',
);
console.log(`Snapshot written: ${papers.length} papers from ${result.source}, ${added.length} new.`);
for (const p of added) console.log(`  + ${p.key}  ${p.title}`);
