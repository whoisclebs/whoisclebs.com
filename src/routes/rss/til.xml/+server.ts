import { notesFeed } from '$lib/server/feeds'

export const prerender = true

export function GET() {
  return new Response(notesFeed(), { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}
