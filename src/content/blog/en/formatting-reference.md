---
title: Formatting reference
description: Every Markdown element this site styles, on one page. Kept as a draft so it never publishes.
pubDate: 2026-07-26
tags: ['reference']
draft: true
---

A kitchen sink for checking styles after a change. `draft: true` keeps it out of
the production build and out of both feeds, but it still renders in `pnpm dev`.

## Headings

Two levels are styled. `h2` is above, `h3` is below.

### A third-level heading

Body text after it.

## Inline

**Bold**, *italic*, `inline code`, a [link](https://astro.build), and
~~strikethrough~~. A footnote-style aside reads fine in parentheses (like this).

## Lists

- First item
- Second item, long enough to wrap onto a second line so the hanging indent is
  visible against the marker
- Third item

1. Ordered one
2. Ordered two
3. Ordered three

## Code

```ts
export function readingTime(body: string | undefined): number {
  if (!body) return 1
  const cjk = body.match(/[㐀-䶿一-鿿]/g)?.length ?? 0
  const words = body.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g)?.length ?? 0
  return Math.max(1, Math.round(cjk / 340 + words / 220))
}
```

## Quote

> A quotation, set with a cinnabar rule on the leading edge. Long enough to wrap
> so the indent on the second line can be checked too.

## Table

| Column       | Type     | Notes                      |
| ------------ | -------- | -------------------------- |
| `title`      | string   | Required                   |
| `pubDate`    | date     | Coerced from a YAML date   |
| `draft`      | boolean  | Defaults to `false`        |

---

Content after a horizontal rule.
