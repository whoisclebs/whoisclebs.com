import { error } from '@sveltejs/kit'
import { getPublishedPosts } from '$lib/content/posts'
import { articleEntries } from '$lib/server/pages'
import { entryMarkdown, markdownResponse } from '$lib/server/publishing/llms'
import type { EntryGenerator, RequestHandler } from './$types'

// Versão Markdown do artigo em pt-BR (`/escrita/<slug>.md`), prerenderizada ao lado da página HTML.
export const prerender = true

export const entries: EntryGenerator = () => articleEntries()

export const GET: RequestHandler = ({ params }) => {
  const post = getPublishedPosts('pt-BR').find((entry) => entry.slug === params.slug)
  if (!post) error(404, 'Artigo não encontrado')
  return markdownResponse(entryMarkdown(post))
}
