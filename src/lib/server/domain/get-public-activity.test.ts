import { describe, expect, it } from 'vitest'
import { FixedClock } from '../infra/memory/fixed-clock'
import { MemoryActivityRepository } from '../infra/memory/memory-activity-repository'
import { getPublicActivity } from './get-public-activity'
import type { PublicActivityItem } from './public-activity'

const WINDOW_MS = 2 * 60 * 60 * 1000
const item = (id: string, occurredAt: string, url = `https://github.com/whoisclebs/repo/pull/${id}`): PublicActivityItem => ({
  id,
  kind: 'pull_request',
  title: `Abriu o pull request #${id} em whoisclebs/repo`,
  url,
  occurredAt,
})

const run = (repository: MemoryActivityRepository, now: string) =>
  getPublicActivity({ repository, clock: new FixedClock(now), freshWindowMs: WINDOW_MS })

describe('getPublicActivity', () => {
  it('fica indisponível quando nunca houve sincronização bem-sucedida', async () => {
    const repository = new MemoryActivityRepository({
      cursor: { source: 'github', lastSuccessAt: null, etag: null, lastError: 'HTTP 500' },
    })
    expect(await run(repository, '2026-09-27T12:00:00Z')).toEqual({ available: false })
  })

  it('fica indisponível sem cursor algum', async () => {
    expect(await run(new MemoryActivityRepository(), '2026-09-27T12:00:00Z')).toEqual({ available: false })
  })

  it('é fresh dentro da janela e sem erro pendente', async () => {
    const repository = new MemoryActivityRepository({
      items: [item('1', '2026-09-27T09:00:00Z'), item('2', '2026-09-27T10:00:00Z')],
      cursor: { source: 'github', lastSuccessAt: '2026-09-27T11:00:00.000Z', etag: 'W/"a"', lastError: null },
    })
    const result = await run(repository, '2026-09-27T12:00:00Z')
    expect(result).toEqual({
      available: true,
      snapshot: {
        source: 'github',
        updatedAt: '2026-09-27T11:00:00.000Z',
        status: 'fresh',
        items: [item('2', '2026-09-27T10:00:00.000Z'), item('1', '2026-09-27T09:00:00.000Z')],
      },
    })
  })

  it('é stale quando a última sincronização passou da janela', async () => {
    const repository = new MemoryActivityRepository({
      items: [item('1', '2026-09-27T09:00:00Z')],
      cursor: { source: 'github', lastSuccessAt: '2026-09-27T09:00:00.000Z', etag: null, lastError: null },
    })
    const result = await run(repository, '2026-09-27T11:00:01Z')
    expect(result.available && result.snapshot.status).toBe('stale')
  })

  it('é stale com a data do último sucesso quando a sincronização mais recente falhou', async () => {
    const repository = new MemoryActivityRepository({
      items: [item('1', '2026-09-27T09:00:00Z')],
      cursor: { source: 'github', lastSuccessAt: '2026-09-27T11:30:00.000Z', etag: null, lastError: 'timeout' },
    })
    const result = await run(repository, '2026-09-27T12:00:00Z')
    expect(result.available && result.snapshot).toMatchObject({ status: 'stale', updatedAt: '2026-09-27T11:30:00.000Z' })
  })

  it('filtra do cache item com URL fora da allowlist e limita a 10', async () => {
    const items = Array.from({ length: 12 }, (_, n) => item(String(n), `2026-09-${10 + n}T00:00:00Z`))
    items.push(item('evil', '2026-09-26T00:00:00Z', 'https://evil.example/whoisclebs'))
    const repository = new MemoryActivityRepository({
      items,
      cursor: { source: 'github', lastSuccessAt: '2026-09-27T11:00:00.000Z', etag: null, lastError: null },
    })
    const result = await run(repository, '2026-09-27T12:00:00Z')
    if (!result.available) throw new Error('esperava snapshot')
    expect(result.snapshot.items).toHaveLength(10)
    expect(result.snapshot.items.some((i) => i.id === 'evil')).toBe(false)
  })

  it('devolve lista vazia (e não 503) quando a fonte sincronizou sem eventos públicos', async () => {
    const repository = new MemoryActivityRepository({
      cursor: { source: 'github', lastSuccessAt: '2026-09-27T11:00:00.000Z', etag: null, lastError: null },
    })
    const result = await run(repository, '2026-09-27T12:00:00Z')
    expect(result.available && result.snapshot.items).toEqual([])
  })
})
