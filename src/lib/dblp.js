// Fetches a DBLP person's publications and normalises them to plain records.
// Plain ESM JavaScript, so that both Astro (at build time) and
// scripts/update-papers.mjs (from the command line) can import it.
//
// Sources are tried in order. dblp.org and its mirror sit behind a
// proof-of-work bot check that plain HTTP clients cannot pass, so the
// SPARQL endpoint is usually the one that answers; the XML endpoints stay
// first in case the check is lifted.

const USER_AGENT = 'alemini18-site/1.0 (+https://github.com/alemini18/alemini18.github.io)';
const TIMEOUT_MS = 20_000;

/**
 * @typedef {{ name: string, pid?: string }} Author
 * @typedef {{
 *   key: string,
 *   title: string,
 *   authors: Author[],
 *   year: number,
 *   kind: 'journal' | 'conference' | 'preprint' | 'book' | 'chapter' | 'other',
 *   venue: string,
 *   pages?: string,
 *   doi?: string,
 *   arxiv?: string,
 *   pdf?: string,
 *   url?: string,
 *   note?: string,
 * }} Paper
 */

/** @param {string} pid */
export function sources(pid) {
  return [
    { name: 'dblp.org (xml)', url: `https://dblp.org/pid/${pid}.xml` },
    { name: 'dblp.uni-trier.de (xml)', url: `https://dblp.uni-trier.de/pid/${pid}.xml` },
    { name: 'sparql.dblp.org', url: 'https://sparql.dblp.org/sparql', sparql: true },
  ];
}

/**
 * Tries every source in turn and returns the first that yields a valid list.
 * @param {string} pid
 * @param {{ log?: (msg: string) => void }} [opts]
 * @returns {Promise<{ source: string, papers: Paper[] } | null>}
 */
export async function fetchDblp(pid, { log = () => {} } = {}) {
  for (const src of sources(pid)) {
    try {
      const papers = await fetchSource(src, pid);
      log(`${src.name}: ok, ${papers.length} records`);
      return { source: src.name, papers };
    } catch (err) {
      log(`${src.name}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return null;
}

/**
 * @param {ReturnType<typeof sources>[number]} src
 * @param {string} pid
 * @returns {Promise<Paper[]>}
 */
export async function fetchSource(src, pid) {
  return src.sparql ? fetchSparql(src.url, pid) : parseXml(await fetchText(src.url));
}

/** @param {string} url @param {RequestInit} [init] */
async function fetchText(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { 'User-Agent': USER_AGENT, ...init.headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  // The bot check answers 202 with an HTML page, so the status alone is not enough.
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  if (/^\s*<!doctype html/i.test(text)) throw new Error('got an HTML page (bot check?)');
  return text;
}

// ---------------------------------------------------------------- XML

const XML_TYPES = /<(article|inproceedings|proceedings|book|incollection|phdthesis|mastersthesis)\s([^>]*)>([\s\S]*?)<\/\1>/g;

/** @param {string} xml @returns {Paper[]} */
export function parseXml(xml) {
  if (!xml.includes('<dblpperson')) throw new Error('not a dblpperson document');
  const papers = [];
  for (const [, tag, attrs, body] of xml.matchAll(XML_TYPES)) {
    const key = attr(attrs, 'key');
    if (!key) continue;
    const informal = attr(attrs, 'publtype') === 'informal';
    const authors = [...body.matchAll(/<(author|editor)([^>]*)>([\s\S]*?)<\/\1>/g)].map(([, , a, name]) => ({
      name: cleanName(decode(stripTags(name))),
      pid: attr(a, 'pid') ?? undefined,
    }));
    const ee = [...body.matchAll(/<ee[^>]*>([\s\S]*?)<\/ee>/g)].map((m) => decode(m[1]));
    const field = (/** @type {string} */ f) => {
      const m = body.match(new RegExp(`<${f}[^>]*>([\\s\\S]*?)</${f}>`));
      return m ? decode(stripTags(m[1])).trim() : undefined;
    };
    const venue = field('journal') ?? field('booktitle') ?? field('publisher') ?? field('school') ?? '';
    const eprint = field('eprint');
    papers.push(
      finish({
        key,
        title: field('title') ?? '',
        authors,
        year: Number(field('year')),
        kind: kindOf(tag, venue, informal),
        venue,
        pages: field('pages'),
        links: ee,
        arxiv: eprint ?? arxivFromVolume(field('volume')),
      }),
    );
  }
  return papers;
}

/** @param {string} attrs @param {string} name */
function attr(attrs, name) {
  const m = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? decode(m[1]) : null;
}

// ------------------------------------------------------------- SPARQL

const SCHEMA = 'https://dblp.org/rdf/schema#';

/** @param {string} endpoint @param {string} pid @returns {Promise<Paper[]>} */
async function fetchSparql(endpoint, pid) {
  const person = `<https://dblp.org/pid/${pid}>`;
  const props = await sparql(
    endpoint,
    `PREFIX dblp: <${SCHEMA}>
     SELECT ?pub ?p ?o WHERE { ?pub dblp:authoredBy ${person} ; ?p ?o . }`,
  );
  const sigs = await sparql(
    endpoint,
    `PREFIX dblp: <${SCHEMA}>
     SELECT ?pub ?ord ?name ?creator WHERE {
       ?pub dblp:authoredBy ${person} ; dblp:hasSignature ?sig .
       ?sig dblp:signatureOrdinal ?ord ; dblp:signatureDblpName ?name .
       OPTIONAL { ?sig dblp:signatureCreator ?creator }
     }`,
  );

  /** @type {Map<string, Record<string, string[]>>} */
  const byPub = new Map();
  for (const row of props) {
    const p = row.p.replace(SCHEMA, '').replace(/^.*[#/]/, '');
    const rec = byPub.get(row.pub) ?? {};
    (rec[p] ??= []).push(row.o);
    byPub.set(row.pub, rec);
  }
  /** @type {Map<string, { ord: number, name: string, pid?: string }[]>} */
  const authorsByPub = new Map();
  for (const row of sigs) {
    const list = authorsByPub.get(row.pub) ?? [];
    list.push({
      ord: Number(row.ord),
      name: cleanName(row.name),
      pid: row.creator?.replace('https://dblp.org/pid/', ''),
    });
    authorsByPub.set(row.pub, list);
  }

  const papers = [];
  for (const [uri, rec] of byPub) {
    const types = (rec.type ?? []).map((t) => t.replace(SCHEMA, ''));
    const tag = types.includes('Article')
      ? 'article'
      : types.includes('Inproceedings')
        ? 'inproceedings'
        : types.includes('Incollection')
          ? 'incollection'
          : types.includes('Book')
            ? 'book'
            : 'other';
    const venue = rec.publishedIn?.[0] ?? '';
    const authors = (authorsByPub.get(uri) ?? [])
      .sort((a, b) => a.ord - b.ord)
      .map(({ name, pid }) => ({ name, pid }));
    papers.push(
      finish({
        key: uri.replace('https://dblp.org/rec/', ''),
        title: rec.title?.[0] ?? '',
        authors,
        year: Number(rec.yearOfPublication?.[0]),
        kind: kindOf(tag, venue, types.includes('Informal')),
        venue,
        pages: rec.pagination?.[0],
        links: [...(rec.doi ?? []), ...(rec.primaryDocumentPage ?? []), ...(rec.documentPage ?? [])],
        arxiv: arxivFromVolume(rec.publishedInJournalVolume?.[0]),
      }),
    );
  }
  if (papers.length === 0) throw new Error('no records');
  return papers;
}

/** @param {string} endpoint @param {string} query @returns {Promise<Record<string, string>[]>} */
async function sparql(endpoint, query) {
  const text = await fetchText(`${endpoint}?query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json' },
  });
  const json = JSON.parse(text);
  return json.results.bindings.map((/** @type {Record<string, { value: string }>} */ b) =>
    Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])),
  );
}

// ------------------------------------------------------------- shared

/**
 * Turns raw link lists into doi / arxiv / pdf / url fields.
 * @param {Omit<Paper, 'doi' | 'pdf' | 'url'> & { links: string[] }} raw
 * @returns {Paper}
 */
function finish({ links, ...p }) {
  /** @type {Paper} */
  const paper = { ...p, title: p.title.replace(/\.$/, '') };
  for (const link of new Set(links)) {
    const doi = link.match(/^https?:\/\/(?:dx\.)?doi\.org\/(.+)$/i)?.[1];
    if (doi) {
      const arxiv = doi.match(/^10\.48550\/arxiv\.(.+)$/i)?.[1];
      if (arxiv) paper.arxiv ??= arxiv;
      else paper.doi ??= doi;
    } else if (/arxiv\.org\/abs\//.test(link)) {
      paper.arxiv ??= link.replace(/^.*arxiv\.org\/abs\//, '');
    } else if (/\.pdf($|\?)/i.test(link)) {
      paper.pdf ??= link;
    } else {
      paper.url ??= link;
    }
  }
  for (const k of /** @type {const} */ (['pages', 'doi', 'arxiv', 'pdf', 'url'])) {
    if (paper[k] === undefined) delete paper[k];
  }
  return paper;
}

/** @param {string} tag @param {string} venue @param {boolean} informal */
function kindOf(tag, venue, informal) {
  if (informal || /^corr$/i.test(venue)) return 'preprint';
  if (tag === 'article') return 'journal';
  if (tag === 'inproceedings') return 'conference';
  if (tag === 'book' || tag === 'proceedings') return 'book';
  if (tag === 'incollection') return 'chapter';
  return 'other';
}

/** CoRR volumes look like "abs/2411.13627". @param {string | undefined} volume */
function arxivFromVolume(volume) {
  return volume?.match(/^abs\/(.+)$/)?.[1];
}

/** DBLP disambiguates homonyms with a numeric suffix ("Jane Doe 0002"). @param {string} name */
function cleanName(name) {
  return name.replace(/\s+\d{4}$/, '').trim();
}

/** @param {string} s */
function stripTags(s) {
  return s.replace(/<[^>]+>/g, '');
}

/** @param {string} s */
function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
