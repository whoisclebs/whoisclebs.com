import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Fronteiras portáveis (spec §1): `domain/` e `ports/` não conhecem framework, plataforma nem infraestrutura.
 * Trocar SvelteKit, Workers ou D1 deve exigir só novos adaptadores em `infra/` e um novo `compose.ts`.
 */
const ROOT = join(import.meta.dirname)
const GUARDED_DIRS = ['domain', 'ports']

const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  { pattern: /^@sveltejs\//, reason: 'SvelteKit' },
  { pattern: /^\$app\//, reason: 'SvelteKit ($app)' },
  { pattern: /^\$env\//, reason: 'SvelteKit ($env)' },
  { pattern: /^\$lib\/server\/infra(\/|$)/, reason: 'infra' },
  { pattern: /^cloudflare:/, reason: 'Cloudflare runtime' },
  { pattern: /^@cloudflare\//, reason: 'Cloudflare SDK/tipos' },
  { pattern: /^wrangler(\/|$)/, reason: 'wrangler' },
  { pattern: /^miniflare(\/|$)/, reason: 'Miniflare' },
  { pattern: /^@octokit\//, reason: 'GitHub SDK' },
  { pattern: /(^|\/)infra(\/|$)/, reason: 'infra' },
  { pattern: /(^|\/)compose(\.ts)?$/, reason: 'composition root' },
]

const IMPORT_RE = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

export function findViolations(source: string): string[] {
  const violations: string[] = []
  for (const match of source.matchAll(IMPORT_RE)) {
    const specifier = match[1] ?? match[2] ?? ''
    const hit = FORBIDDEN.find(({ pattern }) => pattern.test(specifier))
    if (hit) violations.push(`${specifier} (${hit.reason})`)
  }
  // O domínio recebe I/O pelas portas; chamar `fetch` global acoplaria a regra ao runtime.
  const code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  if (/(^|[^.\w])fetch\s*\(/.test(code)) violations.push('fetch global')
  return violations
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|js|svelte)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : []
  })
}

describe('arquitetura: domain e ports são portáveis', () => {
  it('o detector acusa imports proibidos e fetch global', () => {
    const bad = [
      "import { json } from '@sveltejs/kit'",
      "import type { D1Database } from '@cloudflare/workers-types'",
      "import { env } from 'cloudflare:workers'",
      "import { unstable_dev } from 'wrangler'",
      "import { D1ActivityRepository } from '../infra/cloudflare/d1-activity-repository'",
      "export { x } from '$lib/server/infra/memory/fixed-clock'",
      "const m = await import('$app/environment')",
      'const r = await fetch(url)',
    ].join('\n')
    expect(findViolations(bad)).toHaveLength(8)
    expect(findViolations("import type { Clock } from '../ports/clock'\nconst f = deps.fetch(url)")).toEqual([])
  })

  for (const dir of GUARDED_DIRS) {
    it(`${dir}/ não importa SvelteKit, Cloudflare, wrangler nem infra`, () => {
      const files = sourceFiles(join(ROOT, dir))
      expect(files.length).toBeGreaterThan(0)
      const report = files.flatMap((file) =>
        findViolations(readFileSync(file, 'utf8')).map((v) => `${relative(ROOT, file)}: ${v}`),
      )
      expect(report).toEqual([])
    })
  }
})
