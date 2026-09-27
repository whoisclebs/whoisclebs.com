import { describe, expect, it, vi } from 'vitest'
import type { PublicActivityItem } from '../domain/public-activity'
import { FixedClock } from '../infra/memory/fixed-clock'
import { MemoryActivityRepository } from '../infra/memory/memory-activity-repository'
import type { SyncCursor } from '../ports/public-activity-repository'
import { createActivityHandler } from './activity-handler'

const NOW = '2026-09-27T12:00:00.000Z'
const WINDOW_MS = 2 * 60 * 60 * 1000
const item = (id: string, url = `https://github.com/whoisclebs/tuxedo/pull/${id}`): PublicActivityItem => ({
  id,
  kind: 'pull_request',
  title: `Abriu o pull request #${id} em whoisclebs/tuxedo`,
  url,
  occurredAt: `2026-09-2${id}T10:00:00.000Z`,
})
const cursor = (overrides: Partial<SyncCursor> = {}): SyncCursor => ({
  source: 'github',
  lastSuccessAt: '2026-09-27T11:30:00.000Z',
  etag: 'W/"gh"',
  lastError: null,
  ...overrides,
})

function setup(repository: MemoryActivityRepository) {
  const handler = createActivityHandler(() => ({ repository, clock: new FixedClock(NOW), freshWindowMs: WINDOW_MS }))
  return (headers: Record<string, string> = {}) =>
    handler({ request: new Request('https://whoisclebs.com/api/activity', { headers }), platform: undefined })
}

describe('GET /api/activity (contrato HTTP)', () => {
  it('fresh: 200 com o contrato, Cache-Control e ETag', async () => {
    const get = setup(new MemoryActivityRepository({ items: [item('1'), item('2')], cursor: cursor() }))
    const response = await get()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/^application\/json/)
    expect(response.headers.get('cache-control')).toMatch(/max-age=\d+/)
    expect(response.headers.get('etag')).toMatch(/^"[0-9a-f]{32}"$/)
    expect(await response.json()).toEqual({
      source: 'github',
      updatedAt: '2026-09-27T11:30:00.000Z',
      status: 'fresh',
      items: [item('2'), item('1')],
    })
  })

  it('stale: sync falhando com cache → 200, status stale e data do último sucesso', async () => {
    const get = setup(new MemoryActivityRepository({ items: [item('1')], cursor: cursor({ lastError: 'GitHub respondeu HTTP 500' }) }))
    const response = await get()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'stale', updatedAt: '2026-09-27T11:30:00.000Z', items: [item('1')] })
  })

  it('sem cache: 503 com JSON explicativo e sem cache HTTP', async () => {
    const get = setup(new MemoryActivityRepository({ cursor: cursor({ lastSuccessAt: null, etag: null, lastError: 'timeout' }) }))
    const response = await get()
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('retry-after')).toMatch(/^\d+$/)
    expect(await response.json()).toMatchObject({ source: 'github', status: 'unavailable', updatedAt: null, items: [], message: expect.any(String) })
  })

  it('banco indisponível: 503 sem vazar o erro interno', async () => {
    const repository = new MemoryActivityRepository()
    repository.failWith = new Error('D1_ERROR: segredo interno')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await setup(repository)()
    expect(response.status).toBe(503)
    expect(await response.text()).not.toMatch(/segredo/)
    error.mockRestore()
  })

  it('304 quando If-None-Match bate com o ETag (inclusive fraco ou em lista)', async () => {
    const get = setup(new MemoryActivityRepository({ items: [item('1')], cursor: cursor() }))
    const etag = (await get()).headers.get('etag') ?? ''
    for (const header of [etag, `W/${etag}`, `"outro", ${etag}`, '*']) {
      const response = await get({ 'if-none-match': header })
      expect(response.status).toBe(304)
      expect(response.headers.get('etag')).toBe(etag)
      expect(await response.text()).toBe('')
    }
    expect((await get({ 'if-none-match': '"outro"' })).status).toBe(200)
  })

  it('ETag muda quando o conteúdo muda', async () => {
    const repository = new MemoryActivityRepository({ items: [item('1')], cursor: cursor() })
    const get = setup(repository)
    const first = (await get()).headers.get('etag')
    await repository.replaceItems([item('1'), item('2')])
    expect((await get()).headers.get('etag')).not.toBe(first)
  })

  it('filtra item com URL inválida vinda do cache', async () => {
    const get = setup(
      new MemoryActivityRepository({
        items: [item('1'), item('2', 'javascript:alert(1)'), item('3', 'https://evil.example/pull/3')],
        cursor: cursor(),
      }),
    )
    const body = (await (await get()).json()) as { items: PublicActivityItem[] }
    expect(body.items.map((i) => i.id)).toEqual(['1'])
  })
})
