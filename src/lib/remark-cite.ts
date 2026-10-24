// Numbered citations for topic pages.
//
// In a topic file, `[@key]` or `[@key1; @key2]` becomes "[1]" / "[1, 2]",
// numbered by the position of each key in the frontmatter `papers:` list
// and linked to the matching entry. Files without a `papers:` list are
// left untouched.

import type { Root, Text, Link, Parent, PhrasingContent } from 'mdast';
import type { VFile } from 'vfile';
import { basename } from 'node:path';

const CITE = /\[@([^\]]+)\]/g;

export function citeAnchor(topic: string, n: number): string {
  return `ref-${topic}-${n}`;
}

export default function remarkCite() {
  return (tree: Root, file: VFile) => {
    const fm = (file.data as { astro?: { frontmatter?: { papers?: unknown } } }).astro?.frontmatter;
    if (!Array.isArray(fm?.papers)) return;
    const keys = fm.papers as string[];
    const topic = basename(file.path ?? 'topic').replace(/\.mdx?$/, '');

    const walk = (node: Parent) => {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === 'text') {
          const parts = split(child, keys, topic, file);
          if (parts) {
            node.children.splice(i, 1, ...(parts as typeof node.children));
            i += parts.length - 1;
          }
        } else if ('children' in child && child.type !== 'link') {
          walk(child as Parent);
        }
      }
    };
    walk(tree);
  };
}

function split(node: Text, keys: string[], topic: string, file: VFile): PhrasingContent[] | null {
  const text = node.value;
  if (!CITE.test(text)) return null;
  CITE.lastIndex = 0;
  const out: PhrasingContent[] = [];
  let last = 0;
  for (const m of text.matchAll(CITE)) {
    const cited = m[1].split(/[;,]/).map((k) => k.trim().replace(/^@/, ''));
    const numbers = cited.map((k) => keys.indexOf(k) + 1);
    const missing = cited.filter((_, j) => numbers[j] === 0);
    if (missing.length) {
      console.warn(`[cite] ${file.path}: not in the papers list: ${missing.join(', ')}`);
      continue;
    }
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) });
    out.push({ type: 'text', value: '[' });
    numbers.forEach((n, j) => {
      if (j) out.push({ type: 'text', value: ', ' });
      const link: Link = {
        type: 'link',
        url: `#${citeAnchor(topic, n)}`,
        children: [{ type: 'text', value: String(n) }],
        data: { hProperties: { className: ['cite'] } },
      };
      out.push(link);
    });
    out.push({ type: 'text', value: ']' });
    last = m.index + m[0].length;
  }
  if (last === 0) return null;
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) });
  return out;
}
