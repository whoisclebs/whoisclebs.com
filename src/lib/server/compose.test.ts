import { describe, expect, it } from 'vitest'
import { composeActivityReader, composeActivitySync, DEFAULT_FRESH_WINDOW_MINUTES } from './compose'
import { D1ActivityRepository } from './infra/cloudflare/d1-activity-repository'
import { GitHubPublicActivitySource } from './infra/github/public-activity-source'

// Só a presença do binding importa aqui; consultas reais ficam no teste de integração com D1 local.
const DB = {} as never

describe('compose', () => {
  it('monta o leitor com D1 e a janela configurada', () => {
    const deps = composeActivityReader({ DB, ACTIVITY_FRESH_WINDOW_MINUTES: '45' })
    expect(deps.repository).toBeInstanceOf(D1ActivityRepository)
    expect(deps.freshWindowMs).toBe(45 * 60_000)
    expect(Math.abs(deps.clock.now().getTime() - Date.now())).toBeLessThan(1000)
  })

  it('usa a janela padrão quando a variável falta ou é inválida', () => {
    for (const value of [undefined, '', 'abc', '0', '-5']) {
      expect(composeActivityReader({ DB, ACTIVITY_FRESH_WINDOW_MINUTES: value }).freshWindowMs).toBe(DEFAULT_FRESH_WINDOW_MINUTES * 60_000)
    }
  })

  it('falha explicitamente sem o binding D1', () => {
    expect(() => composeActivityReader(undefined)).toThrow(/DB/)
    expect(() => composeActivityReader({})).toThrow(/DB/)
  })

  it('monta o sync com a fonte GitHub do usuário configurado (whoisclebs por padrão)', () => {
    const deps = composeActivitySync({ DB }, async () => new Response('[]'))
    expect(deps.source).toBeInstanceOf(GitHubPublicActivitySource)
    expect(deps.repository).toBeInstanceOf(D1ActivityRepository)
  })
})
