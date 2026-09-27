/**
 * scripts/verify-locale-parity.mjs
 *
 * Paridade profunda de chaves entre `src/lib/i18n/pt-BR.ts` e `src/lib/i18n/en.ts` (inclui arrays:
 * mesmo tamanho e mesmas chaves em cada item). O TypeScript já exige `typeof ptBR` em en.ts; este
 * script dá a mensagem legível antes do build.
 *
 * Uso: node scripts/verify-locale-parity.mjs   (Node ≥ 22.18: importa TypeScript por type stripping)
 */
import { ptBR } from '../src/lib/i18n/pt-BR.ts'
import { en } from '../src/lib/i18n/en.ts'

function compare(a, b, path, errors) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      errors.push(`${path}: listas com tamanhos diferentes`)
      return 0
    }
    return a.reduce((total, item, index) => total + compare(item, b[index], `${path}[${index}]`, errors), 0)
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') {
      errors.push(`${path}: estrutura diferente`)
      return 0
    }
    let total = 0
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(key in a)) errors.push(`${path}.${key}: falta em pt-BR`)
      else if (!(key in b)) errors.push(`${path}.${key}: falta em en`)
      else total += compare(a[key], b[key], `${path}.${key}`, errors)
    }
    return total
  }
  if (typeof a !== typeof b) errors.push(`${path}: tipos diferentes`)
  else if (typeof a === 'string' && (a.trim() === '') !== (b.trim() === '')) errors.push(`${path}: texto vazio em um dos idiomas`)
  return 1
}

const errors = []
const total = compare(ptBR, en, 'messages', errors)
if (errors.length > 0) {
  console.error(`✗ Paridade de locale: ${errors.length} erro(s)\n  ${errors.join('\n  ')}`)
  process.exit(1)
}
console.log(`✓ Paridade de locale OK — ${total} textos em pt-BR e en.`)
