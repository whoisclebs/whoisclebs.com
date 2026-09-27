import { llmsFull } from '$lib/server/publishing/llms'

export const prerender = true

export function GET() {
  return new Response(llmsFull(), { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
