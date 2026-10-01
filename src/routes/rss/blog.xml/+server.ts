import { blogFeed } from '$lib/server/feeds'

export const prerender = true

export function GET() {
  return new Response(blogFeed('pt-BR'), { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}
