import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { composeActivityReader } from '../../src/lib/server/compose'
import { getPublicActivity } from '../../src/lib/server/domain/get-public-activity'
import { runActivitySync } from '../../src/lib/server/jobs/activity-sync'
import { createLocalD1, type LocalD1 } from './local-d1'

const fixture = readFileSync(new URL('../fixtures/github-events.json', import.meta.url), 'utf8')

describe('job de sincronização contra D1 local (GitHub substituído por fixture)', () => {
  let d1: LocalD1
  beforeAll(async () => {
    d1 = await createLocalD1()
  })
  afterAll(async () => {
    await d1?.dispose()
  })

  it('sincroniza, responde 304 do GitHub sem perder cache e marca stale em falha', async () => {
    const seen: (string | null)[] = []
    const ok = async (_input: string | URL | Request, init?: RequestInit) => {
      const etag = new Headers(init?.headers).get('if-none-match')
      seen.push(etag)
      return etag === 'W/"fx"' ? new Response(null, { status: 304 }) : new Response(fixture, { status: 200, headers: { etag: 'W/"fx"' } })
    }

    expect(await getPublicActivity(composeActivityReader(d1.env))).toEqual({ available: false })

    expect(await runActivitySync(d1.env, ok)).toEqual({ outcome: 'updated', stored: 8 })
    const first = await getPublicActivity(composeActivityReader(d1.env))
    if (!first.available) throw new Error('esperava cache')
    expect(first.snapshot.status).toBe('fresh')
    expect(first.snapshot.items).toHaveLength(8)
    expect(first.snapshot.items.every((i) => i.url.startsWith('https://github.com/'))).toBe(true)

    expect(await runActivitySync(d1.env, ok)).toEqual({ outcome: 'not-modified' })
    expect(seen).toEqual([null, 'W/"fx"'])

    const failing = async () => new Response('boom', { status: 502 })
    expect(await runActivitySync(d1.env, failing)).toMatchObject({ outcome: 'failed', error: 'GitHub respondeu HTTP 502' })
    const after = await getPublicActivity(composeActivityReader(d1.env))
    if (!after.available) throw new Error('esperava cache')
    expect(after.snapshot.status).toBe('stale')
    expect(after.snapshot.items).toEqual(first.snapshot.items)
  })
})
