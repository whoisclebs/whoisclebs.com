import { describe, expect, it, vi } from 'vitest'
import { loadActivity, parseActivity, relativeTime } from './activity-client'

const item = (id: string, url = `https://github.com/whoisclebs/repo/pull/${id}`) => ({
  id,
  kind: 'pull_request',
  title: `Abriu o pull request #${id} em whoisclebs/repo`,
  url,
  occurredAt: '2026-09-27T10:00:00.000Z',
})

const body = (status: 'fresh' | 'stale', items = [item('1'), item('2')]) => ({
  source: 'github',
  updatedAt: '2026-09-27T11:00:00.000Z',
  status,
  items,
})

const respond = (status: number, json: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json' } }))

describe('parseActivity', () => {
  it('aceita o contrato fresh/stale da API', () => {
    expect(parseActivity(body('fresh'))).toEqual({ state: 'fresh', updatedAt: '2026-09-27T11:00:00.000Z', items: [item('1'), item('2')] })
    expect(parseActivity(body('stale'))?.state).toBe('stale')
  })

  it('descarta item com URL fora de https://github.com e respeita o limite', () => {
    const items = [item('1'), item('evil', 'https://evil.example/x'), item('3', 'http://github.com/x'), item('4'), item('5')]
    const parsed = parseActivity(body('fresh', items), 2)
    expect(parsed?.items.map((i) => i.id)).toEqual(['1', '4'])
  })

  it('recusa corpo fora do contrato', () => {
    expect(parseActivity(null)).toBeNull()
    expect(parseActivity({ ...body('fresh'), status: 'unavailable' })).toBeNull()
    expect(parseActivity({ ...body('fresh'), updatedAt: 'ontem' })).toBeNull()
    expect(parseActivity({ ...body('fresh'), source: 'gitlab' })).toBeNull()
    expect(parseActivity({ ...body('fresh'), items: 'x' })).toBeNull()
  })

  it('ignora item malformado sem derrubar a lista', () => {
    const parsed = parseActivity(body('fresh', [item('1'), { id: 2 } as never, { ...item('3'), occurredAt: 'x' }]))
    expect(parsed?.items.map((i) => i.id)).toEqual(['1'])
  })
})

describe('loadActivity', () => {
  it('devolve fresh com os itens', async () => {
    const fetch = respond(200, body('fresh'))
    expect(await loadActivity({ fetch })).toMatchObject({ state: 'fresh', items: [{ id: '1' }, { id: '2' }] })
    expect(fetch).toHaveBeenCalledWith('/api/activity', expect.objectContaining({ headers: { accept: 'application/json' } }))
  })

  it('503 vira indisponível', async () => {
    expect(await loadActivity({ fetch: respond(503, { status: 'unavailable' }) })).toEqual({ state: 'unavailable', reason: 'http' })
  })

  it('corpo inválido vira indisponível', async () => {
    expect(await loadActivity({ fetch: respond(200, { hello: 'world' }) })).toEqual({ state: 'unavailable', reason: 'invalid' })
  })

  it('falha de rede vira indisponível', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('offline')
    })
    expect(await loadActivity({ fetch })).toEqual({ state: 'unavailable', reason: 'network' })
  })

  it('aborta depois do timeout e vira indisponível', async () => {
    vi.useFakeTimers()
    try {
      const fetch = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
          }),
      )
      const pending = loadActivity({ fetch, timeoutMs: 4000 })
      await vi.advanceTimersByTimeAsync(4000)
      expect(await pending).toEqual({ state: 'unavailable', reason: 'timeout' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancelamento externo (componente desmontado) também aborta a requisição', async () => {
    const controller = new AbortController()
    let received: AbortSignal | undefined
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          received = init?.signal ?? undefined
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    )
    const pending = loadActivity({ fetch, signal: controller.signal })
    controller.abort()
    expect(await pending).toEqual({ state: 'unavailable', reason: 'aborted' })
    expect(received?.aborted).toBe(true)
  })
})

describe('relativeTime', () => {
  const now = new Date('2026-09-27T12:00:00.000Z')
  it('fala em minutos, horas e dias', () => {
    expect(relativeTime('2026-09-27T11:48:00.000Z', now, 'pt-BR')).toBe('há 12 minutos')
    expect(relativeTime('2026-09-27T09:00:00.000Z', now, 'pt-BR')).toBe('há 3 horas')
    expect(relativeTime('2026-09-26T12:00:00.000Z', now, 'pt-BR')).toBe('ontem')
    expect(relativeTime('2026-09-20T12:00:00.000Z', now, 'en')).toBe('7 days ago')
  })

  it('menos de um minuto (ou relógio adiantado) vira "agora"', () => {
    expect(relativeTime('2026-09-27T11:59:40.000Z', now, 'pt-BR')).toBe('agora')
    expect(relativeTime('2026-09-27T12:05:00.000Z', now, 'en')).toBe('now')
  })
})
