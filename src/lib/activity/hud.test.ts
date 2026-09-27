import { describe, expect, it } from 'vitest'
import { activityBar, EMPTY_BAR, latencyBar, readings, syncBar } from './hud'

const now = new Date('2026-09-27T12:00:00Z')
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()

describe('HUD: barras de 10 segmentos', () => {
  it('atividade: um segmento por evento do cache, no máximo 10', () => {
    expect(activityBar(0)).toEqual({ filled: 0, tone: 'live' })
    expect(activityBar(6)).toEqual({ filled: 6, tone: 'live' })
    expect(activityBar(14)).toEqual({ filled: 10, tone: 'live' })
  })

  it('último sync: esvazia um segmento a cada 6 min e fica cinza acima de 1 h ou quando a API diz stale', () => {
    expect(syncBar(minutesAgo(0), now, 'fresh')).toEqual({ filled: 10, tone: 'live' })
    expect(syncBar(minutesAgo(12), now, 'fresh')).toEqual({ filled: 8, tone: 'live' })
    expect(syncBar(minutesAgo(13), now, 'fresh')).toEqual({ filled: 8, tone: 'live' })
    expect(syncBar(minutesAgo(18), now, 'fresh')).toEqual({ filled: 7, tone: 'live' })
    expect(syncBar(minutesAgo(59), now, 'fresh')).toEqual({ filled: 1, tone: 'live' })
    expect(syncBar(minutesAgo(60), now, 'fresh')).toEqual({ filled: 0, tone: 'live' })
    expect(syncBar(minutesAgo(61), now, 'fresh')).toEqual({ filled: 0, tone: 'dim' })
    expect(syncBar(minutesAgo(5), now, 'stale')).toEqual({ filled: 10, tone: 'dim' })
    // Relógio do servidor adiantado: idade negativa conta como zero, nunca como barra além de cheia.
    expect(syncBar(minutesAgo(-5), now, 'fresh')).toEqual({ filled: 10, tone: 'live' })
  })

  it('latência: 100 ms por segmento, de 0 a 1000 ms', () => {
    expect(latencyBar(0)).toEqual({ filled: 0, tone: 'live' })
    expect(latencyBar(84)).toEqual({ filled: 1, tone: 'live' })
    expect(latencyBar(430)).toEqual({ filled: 5, tone: 'live' })
    expect(latencyBar(5000)).toEqual({ filled: 10, tone: 'live' })
  })

  it('barra vazia e neutra quando não há dado', () => {
    expect(EMPTY_BAR).toEqual({ filled: 0, tone: 'none' })
  })
})

describe('HUD: leituras', () => {
  it('sem resultado (sem JS ou antes da busca): nenhuma leitura, nunca zero', () => {
    expect(readings(null, null)).toEqual({ activity: null, sync: null, latencyMs: null })
  })

  it('fresh: contagem dos itens exibidos, data do sync e latência arredondada', () => {
    const result = { state: 'fresh' as const, updatedAt: minutesAgo(12), items: Array.from({ length: 6 }, (_, i) => ({ id: `${i}`, kind: 'push', title: 't', url: 'https://github.com/x', occurredAt: minutesAgo(30) })) }
    expect(readings(result, 83.6)).toEqual({ activity: { count: 6 }, sync: { updatedAt: minutesAgo(12), status: 'fresh' }, latencyMs: 84 })
  })

  it('API falhando: atividade indisponível, sem sync, latência só se houve resposta', () => {
    expect(readings({ state: 'unavailable', reason: 'http' }, 120)).toEqual({ activity: { unavailable: true }, sync: null, latencyMs: 120 })
    expect(readings({ state: 'unavailable', reason: 'timeout' }, null)).toEqual({ activity: { unavailable: true }, sync: null, latencyMs: null })
  })
})
