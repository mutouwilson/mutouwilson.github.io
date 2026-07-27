import { getCollection, type CollectionEntry } from 'astro:content'
import { isLocale, localeUrl, type Locale } from './i18n'

export type Post = CollectionEntry<'blog'>

/** `zh/hello-world` → `{ locale: 'zh', slug: 'hello-world' }` */
export function parseId(id: string): { locale: Locale; slug: string } {
  const [head, ...rest] = id.split('/')
  if (!head || !isLocale(head) || rest.length === 0) {
    throw new Error(
      `Blog entry "${id}" must live under src/content/blog/<locale>/, ` +
        `where <locale> is one of: en, zh`,
    )
  }
  return { locale: head, slug: rest.join('/') }
}

export function postUrl(locale: Locale, slug: string): string {
  return localeUrl(locale, `blog/${slug}`)
}

/** Published posts for one locale, newest first. Drafts show up in dev only. */
export async function getPosts(locale: Locale): Promise<Post[]> {
  const posts = await getCollection(
    'blog',
    ({ id, data }) =>
      parseId(id).locale === locale && (import.meta.env.DEV || !data.draft),
  )
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
}

/** The same post in the other language, if it has been translated. */
export async function getTranslation(post: Post): Promise<Post | undefined> {
  const { locale, slug } = parseId(post.id)
  const other: Locale = locale === 'en' ? 'zh' : 'en'
  const posts = await getCollection(
    'blog',
    ({ id, data }) => id === `${other}/${slug}` && (import.meta.env.DEV || !data.draft),
  )
  return posts[0]
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/**
 * Rough reading time. Counts CJK by character and everything else by word,
 * since 350 Chinese characters and 350 English words are nothing alike.
 */
export function readingTime(body: string | undefined): number {
  if (!body) return 1
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  const cjk = text.match(/[㐀-䶿一-鿿豈-﫿]/g)?.length ?? 0
  const words = text.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g)?.length ?? 0
  return Math.max(1, Math.round(cjk / 340 + words / 220))
}
