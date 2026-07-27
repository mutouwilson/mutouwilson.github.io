import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

// The repo is named `mutouwilson.github.io` under the user `mutouwilson`, so GitHub
// serves it as a *user site* at the domain root — `base` stays `/`.
//
// If this ever moves to a repo with a different name, it becomes a *project site*
// served from `https://mutouwilson.github.io/<repo>/`, and `base` must become
// `/<repo>`. A custom domain would keep `base: '/'` and only change `site`.
export default defineConfig({
  site: 'https://mutouwilson.github.io',
  base: '/',
  trailingSlash: 'ignore',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    routing: {
      // The core audience is overseas: English lives at `/`, Chinese at `/zh/`.
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', zh: 'zh-CN' },
      },
    }),
  ],

  // Left on Astro 7's default Markdown processor (Sätteri). Adding remark/rehype
  // plugins requires installing @astrojs/markdown-remark, which switches to the
  // unified processor — and its smartypants mis-resolves an opening quote that
  // follows a CJK character (「消灭了"CDN…"」 came out as ”CDN…”). Correct
  // Chinese quotes matter more here than plugin access.
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      wrap: true,
    },
  },
})
