import { describe, expect, it } from 'vitest'
import { en } from './en'
import { ptBR } from './pt-BR'
import { format, formatDate, getMessages, localeFromPath } from './index'

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, shape(v)]))
  }
  return typeof value
}

describe('i18n', () => {
  it('decide o idioma somente pela URL', () => {
    expect(localeFromPath('/')).toBe('pt-BR')
    expect(localeFromPath('/escrita/x/')).toBe('pt-BR')
    expect(localeFromPath('/en/')).toBe('en')
    expect(localeFromPath('/en')).toBe('en')
    expect(localeFromPath('/en/writing/x/')).toBe('en')
    expect(localeFromPath('/entrar/')).toBe('pt-BR')
  })

  it('mantém paridade profunda de chaves entre pt-BR e en', () => {
    expect(shape(en)).toEqual(shape(ptBR))
  })

  it('formata placeholders e datas', () => {
    expect(format('Página {current} de {total}', { current: 1, total: 3 })).toBe('Página 1 de 3')
    expect(formatDate('2025-09-16', 'pt-BR')).toBe('16 de set de 2025')
    expect(formatDate('2025-09-16', 'en')).toBe('Sep 16, 2025')
    expect(getMessages('en')['nav.writing']).toBe('Writing')
  })
})
