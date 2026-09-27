import { afterEach, describe, expect, it, vi } from 'vitest'
import { ACTIVITY_CACHE_LIMIT, requestActivity, resetActivityStore } from './activity-store'

const body = {
  source: 'github',
  status: 'fresh',
  updatedAt: '2026-09-27T11:48:00Z',
  items: Array.from({ length: 12 }, (_, i) => ({ id: `e${i}`, kind: 'push', title: `evento ${i}`, url: `https://github.com/whoisclebs/r${i}`, occurredAt: '2026-09-27T11:00:00Z' })),
}

afterEach(() => resetActivityStore())

describe('requestActivity', () => {
  it('faz uma única chamada para o HUD e o rodapé e mede a latência até a resposta', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    const clock = [100, 184.4]
    const now = () => clock.shift() ?? 999
    const [a, b] = await Promise.all([requestActivity(fetch, now), requestActivity(fetch, now)])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
    expect(a.latencyMs).toBeCloseTo(84.4)
    expect(a.result.state).toBe('fresh')
    if (a.result.state === 'fresh') expect(a.result.items).toHaveLength(ACTIVITY_CACHE_LIMIT)
  })

  it('503: indisponível, com a latência da resposta que chegou', async () => {
    const clock = [0, 40]
    const snapshot = await requestActivity(async () => new Response('{}', { status: 503 }), () => clock.shift() ?? 0)
    expect(snapshot.result).toEqual({ state: 'unavailable', reason: 'http' })
    expect(snapshot.latencyMs).toBe(40)
  })

  it('falha de rede: indisponível e latência sem dado', async () => {
    const snapshot = await requestActivity(async () => {
      throw new TypeError('offline')
    })
    expect(snapshot.result).toEqual({ state: 'unavailable', reason: 'network' })
    expect(snapshot.latencyMs).toBeNull()
  })
})
