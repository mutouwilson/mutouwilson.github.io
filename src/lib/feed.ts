import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { HTML_LANG, t, type Locale } from './i18n'
import { getPosts, parseId, postUrl } from './posts'

/** One feed per locale. Drafts never appear here, even in dev. */
export async function localeFeed(locale: Locale, context: APIContext) {
  if (!context.site) {
    throw new Error('`site` must be set in astro.config.mjs to build an RSS feed')
  }

  const strings = t(locale)
  const posts = (await getPosts(locale)).filter((post) => !post.data.draft)

  return rss({
    title: strings['site.title'],
    description: strings['site.description'],
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postUrl(locale, parseId(post.id).slug),
      categories: post.data.tags,
    })),
    customData: `<language>${HTML_LANG[locale]}</language>`,
  })
}
