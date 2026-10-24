// A small BibTeX reader for data/papers.local.bib. It covers what a
// hand-written publication list needs: braced or quoted values, nested
// braces, common LaTeX accents, "Last, First" names. It is not a full
// BibTeX implementation (no @string macros, no # concatenation).

import type { Paper } from './dblp.js';

type Fields = Record<string, string>;

export function parseBibtex(source: string): Paper[] {
  // "%" starts a comment line; dropping those lets example entries be commented out.
  const src = source
    .split('\n')
    .filter((l) => !l.trimStart().startsWith('%'))
    .join('\n');
  const papers: Paper[] = [];
  let i = 0;
  while ((i = src.indexOf('@', i)) !== -1) {
    const head = src.slice(i).match(/^@(\w+)\s*[{(]/);
    if (!head) {
      i++;
      continue;
    }
    const type = head[1].toLowerCase();
    const start = i + head[0].length;
    const end = matchClose(src, start - 1);
    const body = src.slice(start, end);
    i = end + 1;
    if (['comment', 'preamble', 'string'].includes(type)) continue;

    const comma = body.indexOf(',');
    const key = body.slice(0, comma).trim();
    const fields = parseFields(body.slice(comma + 1));
    papers.push(toPaper(type, key, fields));
  }
  return papers;
}

/** Index of the bracket closing the one at `open`, honouring nesting. */
function matchClose(src: string, open: number): number {
  const closer = src[open] === '(' ? ')' : '}';
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    const c = src[j];
    if (c === '{' || c === src[open]) depth++;
    else if (c === '}' || c === closer) {
      depth--;
      if (depth === 0) return j;
    }
  }
  throw new Error(`papers.local.bib: unbalanced braces near "${src.slice(open, open + 40)}"`);
}

function parseFields(s: string): Fields {
  const fields: Fields = {};
  let i = 0;
  while (i < s.length) {
    const m = s.slice(i).match(/^[\s,]*([\w-]+)\s*=\s*/);
    if (!m) break;
    const name = m[1].toLowerCase();
    i += m[0].length;
    let value: string;
    if (s[i] === '{') {
      const end = matchClose(s, i);
      value = s.slice(i + 1, end);
      i = end + 1;
    } else if (s[i] === '"') {
      const end = s.indexOf('"', i + 1);
      value = s.slice(i + 1, end);
      i = end + 1;
    } else {
      const bare = s.slice(i).match(/^[^,\s}]+/)?.[0] ?? '';
      value = bare;
      i += bare.length;
    }
    fields[name] = value.replace(/\s+/g, ' ').trim();
  }
  return fields;
}

const ACCENTS: Record<string, string> = {
  "'": '́', '`': '̀', '^': '̂', '"': '̈', '~': '̃',
  '=': '̄', '.': '̇', u: '̆', v: '̌', H: '̋', c: '̧', k: '̨',
};
const LETTERS: Record<string, string> = {
  o: 'ø', O: 'Ø', l: 'ł', L: 'Ł', ss: 'ß', ae: 'æ', AE: 'Æ', oe: 'œ', OE: 'Œ', aa: 'å', AA: 'Å', i: 'ı', j: 'ȷ',
};

/** LaTeX text to Unicode. Inline math ($...$) is kept as is and typeset later. */
export function delatex(s: string): string {
  return s
    .split(/(\$[^$]*\$)/)
    .map((part, n) =>
      n % 2
        ? part
        : part
            .replace(/\\([`'^"~=.])\s*\{?\\?([A-Za-z])\}?/g, (_, a, ch) => ch + ACCENTS[a])
            .replace(/\\([uvHck])\s*\{\\?([A-Za-z])\}/g, (_, a, ch) => ch + ACCENTS[a])
            .replace(/\\([uvHck])\s+([A-Za-z])/g, (_, a, ch) => ch + ACCENTS[a])
            .replace(/\\(ss|ae|AE|oe|OE|aa|AA|[oOlLij])(?![A-Za-z])\s*/g, (_, w) => LETTERS[w])
            .replace(/\\&/g, '&')
            .replace(/---/g, '—')
            .replace(/--/g, '–')
            .replace(/~/g, ' ')
            .replace(/[{}]/g, ''),
    )
    .join('')
    .normalize('NFC');
}

function names(list: string | undefined): Paper['authors'] {
  if (!list) return [];
  return list.split(/\s+and\s+/).map((raw) => {
    const name = delatex(raw.trim());
    if (name === 'others') return { name: 'et al.' };
    const [last, first] = name.split(/\s*,\s*/);
    return { name: first ? `${first} ${last}` : name };
  });
}

function toPaper(type: string, key: string, f: Fields): Paper {
  const venue = delatex(f.venue ?? f.booktitle ?? f.journal ?? f.publisher ?? f.howpublished ?? f.school ?? '');
  const arxiv =
    f.arxiv ?? (f.eprint && (!f.archiveprefix || /arxiv/i.test(f.archiveprefix)) ? f.eprint : undefined);
  let kind: Paper['kind'];
  if (f.kind) kind = f.kind as Paper['kind'];
  else if (type === 'article') kind = /arxiv|corr/i.test(venue) ? 'preprint' : 'journal';
  else if (type === 'inproceedings' || type === 'conference') kind = 'conference';
  else if (type === 'book') kind = 'book';
  else if (type === 'incollection' || type === 'inbook') kind = 'chapter';
  else kind = arxiv ? 'preprint' : 'other';

  let year = Number(f.year);
  if (!Number.isFinite(year) || year === 0) {
    console.warn(`[papers] ${key}: missing year in papers.local.bib, using the current year`);
    year = new Date().getFullYear();
  }

  const paper: Paper = {
    key,
    title: delatex(f.title ?? '').replace(/\.$/, ''),
    authors: names(f.author ?? f.editor),
    year,
    kind,
    venue: venue || (kind === 'preprint' ? 'arXiv' : ''),
  };
  if (f.pages) paper.pages = f.pages.replace(/-+/, '–');
  if (f.doi) paper.doi = f.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  if (arxiv) paper.arxiv = arxiv;
  if (f.pdf) paper.pdf = f.pdf;
  if (f.url) paper.url = f.url;
  if (f.note) paper.note = delatex(f.note);
  return paper;
}
