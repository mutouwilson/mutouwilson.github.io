---
title: Building this site
description: A static Astro site with bilingual routing, self-hosted type, and a deploy that is just a push to main.
pubDate: 2026-07-27
tags: ['astro', 'typography']
---

This is the first post, so it may as well be about the thing it is published on.

## Why a static site

Everything here is Markdown compiled to HTML at build time. There is no server,
no database, and no client-side framework — the only JavaScript that ships is a
few lines for the theme toggle. That means the site loads fast on a bad
connection and will keep working untouched for years, which matters more for a
personal blog than any feature I could add instead.

[Astro](https://astro.build) handles the compiling. Its content collections give
each post a typed schema, so a typo in frontmatter fails the build rather than
rendering an empty date somewhere on the page.

## Two languages, one codebase

The site is bilingual. English lives at the root and Chinese under `/zh/`:

| Path                    | Language |
| ----------------------- | -------- |
| `/blog/hello-world`     | English  |
| `/zh/blog/hello-world`  | Chinese  |

Posts are files on disk, and the locale comes from the directory:

```text
src/content/blog/
├── en/hello-world.md
└── zh/hello-world.md
```

Two files sharing a slug are treated as translations of each other, which is
enough to generate the `hreflang` tags and the link at the bottom of each post.
Nothing in the frontmatter records the language — deriving it from the path means
the two can never disagree.

Translating a post is optional. If only the English file exists, the Chinese
index simply does not list it, and no `hreflang` is advertised for a page that
isn't there.

## Type

Latin text is set in [Newsreader](https://fonts.google.com/specimen/Newsreader),
self-hosted rather than loaded from a CDN — one less third-party request, and
browser cache partitioning removed the shared-cache argument for CDN fonts years
ago. Chinese falls back to whatever serif the reader's system provides, which
avoids shipping a multi-megabyte CJK font to everyone.

The two scripts need different treatment in a handful of places. Chinese sets
tighter, so it gets a looser line height and no negative letter-spacing. And
*emphasis* is marked with dots under the characters instead of italics, because
synthesised oblique CJK looks wrong.

> The details that only show up once something is running are the ones worth
> writing down.

## Deploying

A push to `main` triggers a GitHub Actions run that builds the site and uploads
it to GitHub Pages. There is no build step to remember and no dashboard to click
through — the repository is the source of truth, and the deployed site is
whatever `main` produces.
