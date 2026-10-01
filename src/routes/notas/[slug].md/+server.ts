import { error } from '@sveltejs/kit'
import { getPublishedNotes } from '$lib/content/notes'
import { noteEntries } from '$lib/server/pages'
import { entryMarkdown, markdownResponse } from '$lib/server/publishing/llms'
import type { EntryGenerator, RequestHandler } from './$types'

// Versão Markdown da nota (`/notas/<slug>.md`), prerenderizada ao lado da página HTML.
export const prerender = true

export const entries: EntryGenerator = () => noteEntries()

export const GET: RequestHandler = ({ params }) => {
  const note = getPublishedNotes().find((entry) => entry.slug === params.slug)
  if (!note) error(404, 'Nota não encontrada')
  return markdownResponse(entryMarkdown(note))
}
