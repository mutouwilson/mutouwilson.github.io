export const LOCALES = ['en', 'zh'] as const
export type Locale = (typeof LOCALES)[number]

/** Must match `i18n.defaultLocale` in astro.config.mjs. */
export const DEFAULT_LOCALE: Locale = 'en'

export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
}

/** Label used on the button that switches *to* this locale. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  zh: '中文',
}

export const SITE = {
  author: 'Wilson Wang',
  github: 'https://github.com/mutouwilson',
} as const

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/**
 * Build an in-site URL for a locale.
 *
 * Derives the prefix from `import.meta.env.BASE_URL`, so moving this site to a
 * project-page path (`base: '/repo'`) needs no changes here.
 *
 *   localeUrl('en')              → '/'
 *   localeUrl('en', 'blog')      → '/blog'
 *   localeUrl('zh', 'blog/hi')   → '/zh/blog/hi'
 */
export function localeUrl(locale: Locale, path = ''): string {
  const segments = [
    ...import.meta.env.BASE_URL.split('/'),
    ...(locale === DEFAULT_LOCALE ? [] : [locale]),
    ...path.split('/'),
  ].filter(Boolean)
  return `/${segments.join('/')}`
}

/** URL for a file in `public/`, base-aware. `assetUrl('favicon.svg')` → '/favicon.svg' */
export function assetUrl(path: string): string {
  const segments = [...import.meta.env.BASE_URL.split('/'), ...path.split('/')].filter(Boolean)
  return `/${segments.join('/')}`
}

type Dict = {
  'site.title': string
  'site.description': string
  'home.intro': string
  'home.recent': string
  'home.all': string
  'nav.writing': string
  'blog.title': string
  'blog.description': string
  'blog.empty': string
  'post.updated': string
  'post.back': string
  'post.readingTime': (minutes: number) => string
  'post.translation': string
  'lang.switch': string
  'theme.switch': string
  'footer.builtWith': string
  '404.title': string
  '404.body': string
  '404.home': string
}

// TODO(you): `site.description` and `home.intro` are placeholders — rewrite them
// in your own voice. Everything else is chrome you can leave alone.
export const ui: Record<Locale, Dict> = {
  en: {
    'site.title': 'Wilson Wang',
    'site.description': 'Notes on software, systems, and things I am building.',
    'home.intro':
      'I build software. This is where I write down what I learn along the way — mostly about systems, architecture, and the details that only show up once something is running in production.',
    'home.recent': 'Recent',
    'home.all': 'All writing',
    'nav.writing': 'Writing',
    'blog.title': 'Writing',
    'blog.description': 'Everything published here, newest first.',
    'blog.empty': 'Nothing published yet.',
    'post.updated': 'Updated',
    'post.back': 'All writing',
    'post.readingTime': (m) => `${m} min read`,
    'post.translation': '中文版',
    'lang.switch': 'Switch language',
    'theme.switch': 'Switch between light and dark theme',
    'footer.builtWith': 'Built with Astro',
    '404.title': 'Nothing here',
    '404.body': 'That page does not exist, or it moved somewhere else.',
    '404.home': 'Back to the home page',
  },
  zh: {
    'site.title': 'Wilson Wang',
    'site.description': '关于软件、系统，以及我正在做的东西的一些记录。',
    'home.intro':
      '我写软件。这里记录我在过程中学到的东西 —— 大多和系统、架构有关，以及那些只有真正跑起来之后才会浮现的细节。',
    'home.recent': '最近',
    'home.all': '全部文章',
    'nav.writing': '文章',
    'blog.title': '文章',
    'blog.description': '这里发布过的全部内容，由新到旧。',
    'blog.empty': '还没有发布任何文章。',
    'post.updated': '更新于',
    'post.back': '全部文章',
    'post.readingTime': (m) => `约 ${m} 分钟`,
    'post.translation': 'English',
    'lang.switch': '切换语言',
    'theme.switch': '切换浅色/深色主题',
    'footer.builtWith': '由 Astro 构建',
    '404.title': '这里什么也没有',
    '404.body': '这个页面不存在，或者已经搬到别处去了。',
    '404.home': '回到首页',
  },
}

export function t(locale: Locale): Dict {
  return ui[locale]
}
