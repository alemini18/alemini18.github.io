// @ts-check
import { defineConfig } from 'astro/config';
import { writeFile } from 'node:fs/promises';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkCite from './src/lib/remark-cite.ts';
import { site } from './src/site.config.ts';

// Writes dist/CNAME when site.url is a custom domain, so that the domain is
// configured in one place only (src/site.config.ts).
/** @returns {import('astro').AstroIntegration} */
function cname() {
  return {
    name: 'cname',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const host = new URL(site.url).hostname;
        if (host.endsWith('.github.io')) return;
        await writeFile(new URL('CNAME', dir), host + '\n');
        logger.info(`CNAME written for ${host}`);
      },
    },
  };
}

export default defineConfig({
  site: site.url,
  trailingSlash: 'ignore',
  integrations: [cname()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkCite],
      rehypePlugins: [rehypeKatex],
    }),
  },
});
