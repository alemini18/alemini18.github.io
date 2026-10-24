import { getCollection } from 'astro:content';

/** Published posts, newest first. Drafts are included only in `astro dev`. */
export async function getPosts() {
  const posts = await getCollection('posts', (p) => import.meta.env.DEV || !p.data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** ISO dates: 2026-10-24, or 2026-10 with 'month'. */
export function formatDate(d: Date, precision: 'day' | 'month' = 'day') {
  return d.toISOString().slice(0, precision === 'day' ? 10 : 7);
}
