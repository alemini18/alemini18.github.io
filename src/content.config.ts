import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// One file per research theme. `papers` lists DBLP keys
// (e.g. conf/ictcs/DAgostinoMP26) or keys from data/papers.local.bib;
// the body cites them as [@key] and gets numbered [1], [2], ...
const topics = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/topics' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(100),
    papers: z.array(z.string()).default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const news = defineCollection({
  loader: file('src/content/news.yaml'),
  schema: z.object({
    date: z.coerce.date(),
    text: z.string(),
    url: z.string().optional(),
  }),
});

const teaching = defineCollection({
  loader: file('src/content/teaching.yaml'),
  schema: z.object({
    kind: z.enum(['teaching', 'talk']),
    title: z.string(),
    where: z.string().optional(),
    year: z.number(),
    when: z.string().optional(),
    url: z.string().optional(),
  }),
});

export const collections = { topics, posts, news, teaching };
