import { renderSitemap, sitemapEntries } from '$lib/server/feeds'

export const prerender = true

export function GET() {
  return new Response(renderSitemap(sitemapEntries()), { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
