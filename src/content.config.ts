import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// Entries live at `src/content/blog/<locale>/<slug>.md`. With `base` pointing at
// the blog directory, the loader's generated id is `<locale>/<slug>` — so locale
// and slug are derived from the id (see src/lib/posts.ts) instead of being
// repeated in frontmatter, where they could silently drift from the file path.
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
})

export const collections = { blog }
