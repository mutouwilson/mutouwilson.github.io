# mutouwilson.github.io

Personal site and blog. Static [Astro](https://astro.build) build, bilingual
(English at the root, Chinese under `/zh/`), deployed to GitHub Pages on every
push to `main`.

## Commands

```bash
pnpm install
pnpm dev      # local server at http://localhost:4321 — drafts are visible here
pnpm build    # static output into dist/
pnpm preview  # serve dist/ exactly as it will be deployed
pnpm check    # type-check .astro and .ts files
```

## Writing a post

Add a Markdown file under the locale you're writing in:

```
src/content/blog/
├── en/my-post.md     → /blog/my-post
└── zh/my-post.md     → /zh/blog/my-post
```

The locale and the slug both come from the file path, so nothing in the
frontmatter needs to repeat them. Two files sharing a slug are treated as
translations of each other — that's what generates the `hreflang` tags and the
cross-language link at the bottom of a post. A post with no translation is fine;
it just won't appear in the other locale's index.

Frontmatter, validated at build time by `src/content.config.ts`:

```yaml
---
title: Building this site # required
description: One or two sentences. # required — shown in the index, feed, and og:description
pubDate: 2026-07-27 # required — sorts the index
updatedDate: 2026-07-28 # optional
tags: ['astro', 'typography'] # optional, defaults to []
draft: true # optional, defaults to false
---
```

A typo in a required field fails the build rather than rendering something empty.

`draft: true` posts render in `pnpm dev` (marked with a `draft` badge) but are
excluded from `pnpm build`, both indexes, and both RSS feeds.

## What to edit first

`src/lib/i18n.ts` holds every string that isn't a post. Two of them are
placeholders written to be replaced: `site.description` and `home.intro`, in both
locales. `SITE.author` and `SITE.github` are there too.

## Layout

```
src/
├── content.config.ts        collection schema (frontmatter validation)
├── content/blog/{en,zh}/    posts
├── lib/
│   ├── i18n.ts              locales, UI strings, URL builders
│   ├── posts.ts             queries, translation pairing, reading time
│   └── feed.ts              shared RSS builder
├── layouts/                 BaseLayout (head, chrome), PostLayout (article)
├── components/              Header, Footer, PostIndex, SealMark, ThemeToggle,
│                            and the shared HomeView / BlogIndexView bodies
├── styles/global.css        design tokens, @font-face, prose styles
└── pages/
    ├── index.astro          /                    → HomeView locale="en"
    ├── blog/                /blog, /blog/[slug]
    ├── zh/                  /zh, /zh/blog, /zh/blog/[slug]
    ├── rss.xml.ts           /rss.xml             (English)
    ├── zh/rss.xml.ts        /zh/rss.xml          (Chinese)
    └── 404.astro            served by Pages for any unmatched path
```

## Fonts

Latin is [Newsreader](https://fonts.google.com/specimen/Newsreader), self-hosted
from `public/fonts/` and split by `unicode-range` so the `latin-ext` subsets are
only fetched by pages that actually contain accented characters. Chinese falls
back to the reader's system serif rather than shipping a multi-megabyte CJK font.

To update the font, re-fetch the woff2 files from the Google Fonts CSS API and
keep the `unicode-range` declarations in `src/styles/global.css` in sync.

## Deployment and the `base` path

`.github/workflows/deploy.yml` builds on push to `main` and publishes `dist/` to
GitHub Pages. Pages must be set to **GitHub Actions** as its source (Settings →
Pages → Build and deployment → Source).

The repository is named `mutouwilson.github.io` under the user `mutouwilson`,
which makes it a *user site* served at the domain root — so `base` is `/` in
`astro.config.mjs`. This matters if that ever changes:

| Setup                                        | `site`                             | `base`    |
| -------------------------------------------- | ---------------------------------- | --------- |
| User site (repo name == owner name)          | `https://mutouwilson.github.io`    | `/`       |
| Project site (any other repo name)           | `https://mutouwilson.github.io`    | `/<repo>` |
| Custom domain                                | `https://example.com`              | `/`       |

All internal URLs are built by `localeUrl()` and `assetUrl()` in
`src/lib/i18n.ts`, both derived from `import.meta.env.BASE_URL` — so changing
`base` in the config is enough, with one exception: the `@font-face` `src` paths
in `src/styles/global.css` are plain CSS and would need updating by hand.
