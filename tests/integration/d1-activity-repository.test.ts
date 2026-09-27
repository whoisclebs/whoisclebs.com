import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { PublicActivityItem } from '../../src/lib/server/domain/public-activity'
import { D1ActivityRepository } from '../../src/lib/server/infra/cloudflare/d1-activity-repository'
import { createLocalD1, type LocalD1 } from './local-d1'

const item = (id: string, occurredAt: string): PublicActivityItem => ({
  id,
  kind: 'release',
  title: `Publicou a versão v${id} de whoisclebs/tuxedo`,
  url: `https://github.com/whoisclebs/tuxedo/releases/tag/v${id}`,
  occurredAt,
})

describe('D1ActivityRepository (D1 local, migrações do zero)', () => {
  let d1: LocalD1
  let repository: D1ActivityRepository

  beforeAll(async () => {
    d1 = await createLocalD1()
  })
  afterAll(async () => {
    await d1?.dispose()
  })
  beforeEach(async () => {
    await d1.env.DB.batch([d1.env.DB.prepare('DELETE FROM public_activity'), d1.env.DB.prepare('DELETE FROM sync_cursor')])
    repository = new D1ActivityRepository(d1.env.DB)
  })

  it('as migrações criam as tabelas esperadas', async () => {
    const { results } = await d1.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('public_activity', 'sync_cursor') ORDER BY name",
    ).all<{ name: string }>()
    expect(results.map((r) => r.name)).toEqual(['public_activity', 'sync_cursor'])
  })

  it('começa vazio e sem cursor', async () => {
    expect(await repository.listRecent(10)).toEqual([])
    expect(await repository.getCursor('github')).toBeNull()
  })

  it('grava e lista do mais recente ao mais antigo, respeitando o limite', async () => {
    await repository.replaceItems([item('1', '2026-09-01T00:00:00.000Z'), item('2', '2026-09-03T00:00:00.000Z'), item('3', '2026-09-02T00:00:00.000Z')])
    expect((await repository.listRecent(2)).map((i) => i.id)).toEqual(['2', '3'])
    expect(await repository.listRecent(1)).toEqual([item('2', '2026-09-03T00:00:00.000Z')])
  })

  it('upsert por ID externo é idempotente e remove o que saiu da fonte', async () => {
    await repository.replaceItems([item('1', '2026-09-01T00:00:00.000Z'), item('2', '2026-09-02T00:00:00.000Z')])
    await repository.replaceItems([item('1', '2026-09-01T00:00:00.000Z'), item('2', '2026-09-02T00:00:00.000Z')])
    const updated = { ...item('2', '2026-09-02T00:00:00.000Z'), title: 'Título atualizado' }
    await repository.replaceItems([updated, item('4', '2026-09-04T00:00:00.000Z')])
    expect(await repository.listRecent(10)).toEqual([item('4', '2026-09-04T00:00:00.000Z'), updated])
  })

  it('lista vazia limpa o cache', async () => {
    await repository.replaceItems([item('1', '2026-09-01T00:00:00.000Z')])
    await repository.replaceItems([])
    expect(await repository.listRecent(10)).toEqual([])
  })

  it('o banco recusa URL fora de https://github.com (CHECK)', async () => {
    await expect(repository.replaceItems([{ ...item('x', '2026-09-01T00:00:00.000Z'), url: 'https://evil.example/' }])).rejects.toThrow()
  })

  it('salva e atualiza o cursor', async () => {
    await repository.saveCursor({ source: 'github', lastSuccessAt: null, etag: null, lastError: 'timeout' })
    await repository.saveCursor({ source: 'github', lastSuccessAt: '2026-09-27T12:00:00.000Z', etag: 'W/"abc"', lastError: null })
    expect(await repository.getCursor('github')).toEqual({
      source: 'github',
      lastSuccessAt: '2026-09-27T12:00:00.000Z',
      etag: 'W/"abc"',
      lastError: null,
    })
  })
})
