/**
 * scripts/validate-editorial.mjs
 *
 * Validação editorial antes do build: front matter de artigos e notas contra os schemas Zod de
 * `src/lib/content/schema.ts` (os mesmos usados no carregamento do site), idioma explícito,
 * coerência idioma × nome do arquivo e pares de tradução; estudos de caso contra `caseStudySchema`
 * (toda seção com fonte, fontes só em github.com/whoisclebs.com, trechos com permalink fixado).
 *
 * Uso: node scripts/validate-editorial.mjs   (Node ≥ 22.18: importa TypeScript por type stripping)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import {
  formatIssues,
  noteFrontmatterSchema,
  parseFrontmatter,
  postFrontmatterSchema,
  validateTranslationPairs,
} from '../src/lib/content/schema.ts'
import { caseStudySchema } from '../src/lib/content/case-schema.ts'

const POSTS_DIR = 'src/content/posts'
const NOTES_DIR = 'src/content/til'

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((item) => {
    const full = join(dir, item)
    if (statSync(full).isDirectory()) return markdownFiles(full)
    return item.endsWith('.md') ? [full] : []
  })
}

function validate(files, schema, extra) {
  const errors = []
  const parsed = []
  for (const file of files) {
    let data
    try {
      data = parseFrontmatter(readFileSync(file, 'utf8')).data
    } catch (error) {
      errors.push(`  ${file}: ${error.message}`)
      continue
    }
    if (!data.locale) errors.push(`  ${file}: [locale] idioma explícito é obrigatório (pt-BR ou en)`)
    const result = schema.safeParse(data)
    if (!result.success) {
      errors.push(formatIssues(file, result.error))
      continue
    }
    errors.push(...extra(file, result.data))
    parsed.push({ file, ...result.data })
  }
  return { errors, parsed }
}

const posts = validate(markdownFiles(POSTS_DIR), postFrontmatterSchema, (file, meta) => {
  const expected = basename(file, '.md')
  return expected === meta.locale ? [] : [`  ${file}: [locale] "${meta.locale}" não corresponde ao nome do arquivo`]
})
posts.errors.push(
  ...validateTranslationPairs(posts.parsed.map((post) => ({ ...post, translationKey: post.translationKey ?? post.slug }))).map((m) => `  ${m}`),
)

const notes = validate(markdownFiles(NOTES_DIR), noteFrontmatterSchema, (file, meta) =>
  meta.locale === 'pt-BR' ? [] : [`  ${file}: [locale] notas só existem em pt-BR`],
)

// Os cases são módulos TS; importá-los já roda o parse. Aqui o erro vira mensagem por case, não stack trace.
const { tuxedoCase } = await import('../src/lib/content/cases/tuxedo.ts')
const { golpherCase } = await import('../src/lib/content/cases/golpher.ts')
const caseInputs = [tuxedoCase, golpherCase]
const cases = { errors: [] }
for (const input of caseInputs) {
  const result = caseStudySchema.safeParse(input)
  if (!result.success) cases.errors.push(formatIssues(`case ${input.slug}`, result.error))
}

let failed = false
for (const [label, result, count] of [
  ['Artigos', posts, markdownFiles(POSTS_DIR).length],
  ['Notas', notes, markdownFiles(NOTES_DIR).length],
  ['Estudos de caso', cases, caseInputs.length],
]) {
  if (result.errors.length > 0) {
    failed = true
    console.error(`\n✗ ${label}: ${result.errors.length} erro(s)\n${result.errors.join('\n')}`)
  } else {
    console.log(`✓ ${label} (${count} arquivos) válidos`)
  }
}

process.exit(failed ? 1 : 0)
