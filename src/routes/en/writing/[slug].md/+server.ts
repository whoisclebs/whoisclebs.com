import { error } from '@sveltejs/kit'
import { getPublishedPosts } from '$lib/content/posts'
import { articleEntriesEn } from '$lib/server/pages'
import { entryMarkdown, markdownResponse } from '$lib/server/publishing/llms'
import type { EntryGenerator, RequestHandler } from './$types'

// Versão Markdown do artigo em inglês (`/en/writing/<slug>.md`), prerenderizada ao lado da página HTML.
export const prerender = true

export const entries: EntryGenerator = () => articleEntriesEn()

export const GET: RequestHandler = ({ params }) => {
  const post = getPublishedPosts('en').find((entry) => entry.slug === params.slug)
  if (!post) error(404, 'Article not found')
  return markdownResponse(entryMarkdown(post))
}
