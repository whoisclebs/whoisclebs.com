import { buildResume } from '$lib/server/publishing/resume'

export const prerender = true

export function GET() {
  return new Response(`${JSON.stringify(buildResume(), null, 2)}\n`, { headers: { 'content-type': 'application/json; charset=utf-8' } })
}
