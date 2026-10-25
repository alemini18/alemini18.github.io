# alemini18.github.io

Personal academic site, built with [Astro](https://astro.build) as a fully static site and deployed to GitHub Pages by
`.github/workflows/deploy.yml` (on every push to `main`, every Monday, and by hand from the Actions tab).

```sh
npm install
npm run dev             # http://localhost:4321, drafts included
npm run build           # dist/
npm run update-papers   # refresh data/dblp.snapshot.json from DBLP
```

## Where things live

| What | Where |
| --- | --- |
| Name, about text, links (empty = hidden), DBLP pid, site URL | `src/site.config.ts` |
| Research themes (one file each, cite as `[@key]`) | `src/content/topics/*.md` |
| Papers not on DBLP | `data/papers.local.bib` |
| News | `src/content/news.yaml` |
| Teaching and talks | `src/content/teaching.yaml` |
| Notes / blog (RSS at `/rss.xml`; nothing is published until the first non-draft post) | `src/content/posts/*.md` |
| Colours (light and dark) | top of `src/styles/global.css` |

## Papers

At build time the DBLP record is fetched from `dblp.org`, then the `dblp.uni-trier.de` mirror, then
`sparql.dblp.org`. The first two currently answer with a bot check, so SPARQL is the one that works. If none
answers, the build uses `data/dblp.snapshot.json`; run `npm run update-papers` now and then to keep it current
(`npm run update-papers -- --check` only reports which sources answer). `DBLP_OFFLINE=1` skips the network.

Entries from `papers.local.bib` are merged with DBLP: records with the same DOI, arXiv id or title become one
entry, and the published version wins over a preprint, keeping its arXiv link.

In a topic, list paper keys (DBLP keys such as `conf/ictcs/DAgostinoMP26`, or BibTeX keys) under `papers:`. In the
text, `[@key]` becomes `[n]`, numbered by the order of that list.

## Custom domain

Set `url` in `src/site.config.ts` to the new address: the build then writes a matching `CNAME` file. Also enter
the domain in the repository settings under *Settings → Pages → Custom domain*, because Pages deployments made
from Actions take the domain from there.

## Search engines

Every build writes `sitemap-index.xml` (pages only, via `@astrojs/sitemap`) and a `robots.txt` that points to it,
both using `url` from `src/site.config.ts`. Submit `https://<site>/sitemap-index.xml` once in Google Search Console
and Bing Webmaster Tools; after a domain change, verify the new domain and submit it again.
