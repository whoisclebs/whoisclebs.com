import { describe, expect, it } from 'vitest'
import { buildInfo, REPOSITORY_URL } from './build-info'

describe('buildInfo', () => {
  it('SHA de 40 caracteres vira texto curto com link para o commit', () => {
    const sha = 'b634ad49dd6c840c94add87e61e6d4e845252a04'
    expect(buildInfo(sha)).toEqual({ sha, short: 'b634ad4', url: `${REPOSITORY_URL}/commit/${sha}` })
  })

  it('sem SHA válido não há build para mostrar (o HUD diz "sem dado")', () => {
    expect(buildInfo('')).toBeNull()
    expect(buildInfo('main')).toBeNull()
  })

  it('o build de teste recebe o SHA do Git pelo define do Vite', () => {
    expect(typeof __BUILD_SHA__).toBe('string')
  })
})
