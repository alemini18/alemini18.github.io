// The RSS feed of the notes, at /rss.xml. It is a dynamic route only so that
// nothing is generated while there are no published posts.
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { fullName } from '../site.config';
import { getPosts } from '../lib/posts';

export async function getStaticPaths() {
  const posts = await getPosts();
  return posts.length > 0 ? [{ params: { feed: 'rss' } }] : [];
}

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${fullName} · Notes`,
    description: `Notes and short posts by ${fullName}.`,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.description,
      link: `/notes/${p.id}/`,
    })),
  });
}
