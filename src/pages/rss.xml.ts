import type { APIContext } from 'astro'
import { localeFeed } from '../lib/feed'

export const GET = (context: APIContext) => localeFeed('en', context)
