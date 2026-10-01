import { describe, expect, it } from 'vitest'
import { FixedClock } from '../infra/memory/fixed-clock'
import { MemoryActivityRepository } from '../infra/memory/memory-activity-repository'
import { MemoryActivitySource } from '../infra/memory/memory-activity-source'
import type { PublicActivityItem } from './public-activity'
import { syncPublicActivity } from './sync-public-activity'

const NOW = '2026-09-27T12:00:00.000Z'
const item = (id: string, occurredAt = '2026-09-27T10:00:00.000Z', url = `https://github.com/whoisclebs/r/issues/${id}`): PublicActivityItem => ({
  id,
  kind: 'issue',
  title: `Abriu a issue #${id} em whoisclebs/r`,
  url,
  occurredAt,
})

describe('syncPublicActivity', () => {
  it('grava itens válidos e registra sucesso com ETag', async () => {
    const repository = new MemoryActivityRepository()
    const source = new MemoryActivitySource([{ status: 'ok', items: [item('1'), item('2')], etag: 'W/"e1"' }])
    const result = await syncPublicActivity({ repository, source, clock: new FixedClock(NOW) })

    expect(result).toEqual({ outcome: 'updated', stored: 2 })
    expect((await repository.listRecent(10)).map((i) => i.id).sort()).toEqual(['1', '2'])
    expect(await repository.getCursor('github')).toEqual({ source: 'github', lastSuccessAt: NOW, etag: 'W/"e1"', lastError: null })
  })

  it('é idempotente: rodar duas vezes com os mesmos eventos não duplica', async () => {
    const repository = new MemoryActivityRepository()
    const source = new MemoryActivitySource([{ status: 'ok', items: [item('1'), item('2')], etag: null }])
    const deps = { repository, source, clock: new FixedClock(NOW) }
    await syncPublicActivity(deps)
    await syncPublicActivity(deps)
    expect(await repository.listRecent(10)).toHaveLength(2)
  })

  it('descarta URL inválida e guarda no máximo 10 itens', async () => {
    const repository = new MemoryActivityRepository()
    const items = Array.from({ length: 14 }, (_, n) => item(String(n), `2026-09-${10 + n}T00:00:00.000Z`))
    items.push(item('evil', '2026-09-27T11:00:00.000Z', 'http://github.com/whoisclebs'))
    const source = new MemoryActivitySource([{ status: 'ok', items, etag: null }])
    const result = await syncPublicActivity({ repository, source, clock: new FixedClock(NOW) })
    const stored = await repository.listRecent(50)
    expect(result).toEqual({ outcome: 'updated', stored: 10 })
    expect(stored).toHaveLength(10)
    expect(stored.some((i) => i.id === 'evil')).toBe(false)
  })

  it('remove do cache evento que deixou de aparecer na fonte pública', async () => {
    const repository = new MemoryActivityRepository({ items: [item('antigo')] })
    const source = new MemoryActivitySource([{ status: 'ok', items: [item('novo')], etag: null }])
    await syncPublicActivity({ repository, source, clock: new FixedClock(NOW) })
    expect((await repository.listRecent(10)).map((i) => i.id)).toEqual(['novo'])
  })

  it('envia o ETag salvo e, com 304, mantém itens e renova o sucesso', async () => {
    const repository = new MemoryActivityRepository({
      items: [item('1')],
      cursor: { source: 'github', lastSuccessAt: '2026-09-27T11:00:00.000Z', etag: 'W/"e1"', lastError: 'timeout' },
    })
    const source = new MemoryActivitySource([{ status: 'not-modified' }])
    const result = await syncPublicActivity({ repository, source, clock: new FixedClock(NOW) })

    expect(source.receivedEtags).toEqual(['W/"e1"'])
    expect(result).toEqual({ outcome: 'not-modified' })
    expect(await repository.listRecent(10)).toHaveLength(1)
    expect(await repository.getCursor('github')).toEqual({ source: 'github', lastSuccessAt: NOW, etag: 'W/"e1"', lastError: null })
  })

  it('não envia ETag se nunca houve sucesso (evita 304 sobre cache vazio)', async () => {
    const repository = new MemoryActivityRepository({
      cursor: { source: 'github', lastSuccessAt: null, etag: 'W/"velho"', lastError: 'x' },
    })
    const source = new MemoryActivitySource([{ status: 'ok', items: [], etag: null }])
    await syncPublicActivity({ repository, source, clock: new FixedClock(NOW) })
    expect(source.receivedEtags).toEqual([null])
  })

  it('em falha mantém o cache antigo e registra erro resumido', async () => {
    const repository = new MemoryActivityRepository({
      items: [item('1')],
      cursor: { source: 'github', lastSuccessAt: '2026-09-27T11:00:00.000Z', etag: 'W/"e1"', lastError: null },
    })
    const source = new MemoryActivitySource([new Error(`GitHub respondeu HTTP 503 ${'x'.repeat(500)}`)])
    const result = await syncPublicActivity({ repository, source, clock: new FixedClock(NOW) })

    expect(result.outcome).toBe('failed')
    expect(await repository.listRecent(10)).toHaveLength(1)
    const cursor = await repository.getCursor('github')
    expect(cursor).toMatchObject({ lastSuccessAt: '2026-09-27T11:00:00.000Z', etag: 'W/"e1"' })
    expect(cursor?.lastError).toMatch(/^GitHub respondeu HTTP 503/)
    expect(cursor?.lastError?.length).toBeLessThanOrEqual(200)
  })

  it('registra falha também quando não havia cursor', async () => {
    const repository = new MemoryActivityRepository()
    const source = new MemoryActivitySource([new Error('timeout')])
    await syncPublicActivity({ repository, source, clock: new FixedClock(NOW) })
    expect(await repository.getCursor('github')).toEqual({ source: 'github', lastSuccessAt: null, etag: null, lastError: 'timeout' })
  })
})
