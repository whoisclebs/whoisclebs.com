import { describe, expect, it } from 'vitest'
import { isAllowedActivityUrl, MAX_ACTIVITY_ITEMS, sanitizeActivityItems, type PublicActivityItem } from './public-activity'

const item = (overrides: Partial<PublicActivityItem> = {}): PublicActivityItem => ({
  id: '1',
  kind: 'push',
  title: 'Enviou commits para whoisclebs/tuxedo (main)',
  url: 'https://github.com/whoisclebs/tuxedo',
  occurredAt: '2026-09-20T10:00:00Z',
  ...overrides,
})

describe('isAllowedActivityUrl', () => {
  it.each([
    'https://github.com/whoisclebs/tuxedo',
    'https://github.com/whoisclebs/tuxedo/pull/12',
    'https://github.com/whoisclebs/tuxedo/commit/0123456789abcdef0123456789abcdef01234567',
  ])('aceita %s', (url) => {
    expect(isAllowedActivityUrl(url)).toBe(true)
  })

  it.each([
    'http://github.com/whoisclebs/tuxedo',
    'https://gist.github.com/whoisclebs',
    'https://github.com.evil.example/whoisclebs',
    'https://evil.example/?u=https://github.com/x',
    'https://user:pass@github.com/whoisclebs',
    'https://github.com:8443/whoisclebs',
    'javascript:alert(1)',
    'not a url',
    '',
  ])('recusa %s', (url) => {
    expect(isAllowedActivityUrl(url)).toBe(false)
  })
})

describe('sanitizeActivityItems', () => {
  it('descarta item com URL fora da allowlist', () => {
    const result = sanitizeActivityItems([item({ id: 'ok' }), item({ id: 'bad', url: 'https://evil.example/x' })])
    expect(result.map((i) => i.id)).toEqual(['ok'])
  })

  it('descarta tipo desconhecido, título vazio e data inválida', () => {
    const result = sanitizeActivityItems([
      { ...item({ id: 'kind' }), kind: 'secret' as PublicActivityItem['kind'] },
      item({ id: 'title', title: '   ' }),
      item({ id: 'date', occurredAt: 'ontem' }),
      item({ id: 'ok' }),
    ])
    expect(result.map((i) => i.id)).toEqual(['ok'])
  })

  it('ordena do mais recente ao mais antigo e limita a 10 itens', () => {
    const many = Array.from({ length: 15 }, (_, n) =>
      item({ id: String(n), occurredAt: new Date(Date.UTC(2026, 8, 1 + n)).toISOString() }),
    )
    const result = sanitizeActivityItems(many)
    expect(result).toHaveLength(MAX_ACTIVITY_ITEMS)
    expect(result[0]?.id).toBe('14')
    expect(result.at(-1)?.id).toBe('5')
  })

  it('remove duplicatas pelo id externo', () => {
    const result = sanitizeActivityItems([item({ id: 'a' }), item({ id: 'a', title: 'outro' })])
    expect(result).toHaveLength(1)
  })

  it('normaliza título (espaços e caracteres de controle) e data em ISO', () => {
    const [result] = sanitizeActivityItems([item({ title: '  Abriu\u0000 o PR   #1  ', occurredAt: '2026-09-20T10:00:00+00:00' })])
    expect(result?.title).toBe('Abriu o PR #1')
    expect(result?.occurredAt).toBe('2026-09-20T10:00:00.000Z')
  })
})
