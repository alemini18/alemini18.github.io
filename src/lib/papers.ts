// The publication list used by every page: DBLP (live, or the saved
// snapshot) merged with data/papers.local.bib, without duplicates.

import snapshot from '../../data/dblp.snapshot.json';
import localBib from '../../data/papers.local.bib?raw';
import { site } from '../site.config';
import { fetchDblp, type Paper } from './dblp.js';
import { parseBibtex } from './bibtex';

export interface MergedPaper extends Paper {
  /** Every key that refers to this paper: its own first, then merged duplicates. */
  keys: string[];
  source: 'dblp' | 'local';
  /** Other non-preprint versions folded into this entry, e.g. "ICALP 2024". */
  also: string[];
}

export interface PaperList {
  papers: MergedPaper[];
  byKey: Map<string, MergedPaper>;
  source: string;
}

// Lower rank wins when duplicates are merged: published before preprint.
const RANK: Record<Paper['kind'], number> = {
  journal: 0,
  conference: 1,
  book: 1,
  chapter: 2,
  other: 3,
  preprint: 4,
};

let cached: Promise<PaperList> | undefined;

/** Fetched once per build and shared by all pages. */
export function getPapers(): Promise<PaperList> {
  return (cached ??= load());
}

async function load(): Promise<PaperList> {
  const log = (m: string) => console.log(`[papers] ${m}`);
  let dblp: Paper[];
  let source: string;
  const live = process.env.DBLP_OFFLINE ? null : await fetchDblp(site.dblpPid, { log });
  if (live) {
    dblp = live.papers;
    source = live.source;
  } else {
    dblp = snapshot.papers as Paper[];
    source = `snapshot of ${snapshot.fetchedAt.slice(0, 10)}`;
    log(`DBLP not reachable, using the saved snapshot (${snapshot.fetchedAt})`);
  }
  const local = parseBibtex(localBib);
  const papers = merge([
    ...dblp.map((p) => ({ ...p, source: 'dblp' as const })),
    ...local.map((p) => ({ ...p, source: 'local' as const })),
  ]);
  log(`${dblp.length} from ${source}, ${local.length} local, ${papers.length} after merging`);

  const byKey = new Map<string, MergedPaper>();
  for (const p of papers) for (const k of p.keys) byKey.set(k, p);
  return { papers, byKey, source };
}

export function normTitle(t: string): string {
  return t
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function merge(all: (Paper & { source: 'dblp' | 'local' })[]): MergedPaper[] {
  // Union–find over shared DOI, arXiv id or normalised title.
  const parent = all.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const seen = new Map<string, number>();
  all.forEach((p, i) => {
    const ids = [p.doi && `doi:${p.doi.toLowerCase()}`, p.arxiv && `arxiv:${p.arxiv}`, `title:${normTitle(p.title)}`];
    for (const id of ids) {
      if (!id) continue;
      const j = seen.get(id);
      if (j === undefined) seen.set(id, i);
      else parent[find(i)] = find(j);
    }
  });

  const groups = new Map<number, typeof all>();
  all.forEach((p, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), p]);
  });

  const merged: MergedPaper[] = [];
  for (const group of groups.values()) {
    group.sort(
      (a, b) =>
        RANK[a.kind] - RANK[b.kind] ||
        (a.source === b.source ? 0 : a.source === 'dblp' ? -1 : 1) ||
        b.year - a.year,
    );
    const [primary, ...rest] = group;
    const m: MergedPaper = { ...primary, keys: group.map((p) => p.key), also: [] };
    for (const p of rest) {
      m.pdf ??= p.pdf;
      m.doi ??= p.doi;
      m.arxiv ??= p.arxiv;
      m.url ??= p.url;
      m.pages ??= p.pages;
      m.note ??= p.note;
      const label = `${p.venue} ${p.year}`;
      if (p.venue && p.kind !== 'preprint' && label !== `${m.venue} ${m.year}` && !m.also.includes(label)) {
        m.also.push(label);
      }
    }
    merged.push(m);
  }
  return merged.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

/** Outbound links of a paper, in display order. */
export function paperLinks(p: Paper): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [];
  const pdf = p.pdf ?? (p.arxiv ? `https://arxiv.org/pdf/${p.arxiv}` : undefined);
  if (pdf) links.push({ label: 'pdf', href: pdf });
  if (p.doi) links.push({ label: 'doi', href: `https://doi.org/${p.doi}` });
  if (p.arxiv) links.push({ label: 'arXiv', href: `https://arxiv.org/abs/${p.arxiv}` });
  if (p.url && !p.doi) links.push({ label: 'web', href: p.url });
  return links;
}
