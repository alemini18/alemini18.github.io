import { getCollection } from 'astro:content';

/** Published posts, newest first. Drafts are included only in `astro dev`. */
export async function getPosts() {
  const posts = await getCollection('posts', (p) => import.meta.env.DEV || !p.data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatDate(d: Date, opts: Intl.DateTimeFormatOptions = { dateStyle: 'long' }) {
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });
}
