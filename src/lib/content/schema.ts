/**
 * Schemas Zod da camada de conteúdo. Autocontido (só importa `zod`) para ser reutilizado pelos scripts
 * de validação em Node (`scripts/validate-editorial.mjs`) sem bundler.
 */
import { z } from 'zod'

export const SITE_URL = 'https://whoisclebs.com'

export const localeSchema = z.enum(['pt-BR', 'en'])

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug deve ser kebab-case ASCII')

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
  }, 'data inexistente no calendário')

export const httpsUrlSchema = z.url({ protocol: /^https$/ })

/** Canonical absoluto no domínio do site, sempre com barra final. */
export const canonicalSchema = z
  .string()
  .refine((value) => value.startsWith(`${SITE_URL}/`) && value.endsWith('/'), 'canonical deve ser absoluto em whoisclebs.com e terminar com /')

/** Imagem pública do site (`/pasta/arquivo.ext`) ou URL https externa. */
export const imageSrcSchema = z.union([z.string().regex(/^\/[\w&./-]+\.(png|jpe?g|jfif|webp|avif|svg)$/i, 'imagem local deve ser um caminho público como /cover/x.png'), httpsUrlSchema])

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true')

/** Lista separada por vírgula no front matter (`sources: https://a, https://b`). */
const urlList = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(httpsUrlSchema))

const nonEmpty = z.string().trim().min(1)

export const postFrontmatterSchema = z
  .object({
    slug: slugSchema,
    translationKey: slugSchema.optional(),
    title: nonEmpty,
    kicker: nonEmpty,
    date: isoDateSchema,
    updated: isoDateSchema.optional(),
    readingTime: nonEmpty,
    author: nonEmpty,
    excerpt: nonEmpty,
    cover: imageSrcSchema,
    coverAlt: nonEmpty,
    published: booleanString,
    locale: localeSchema.default('pt-BR'),
    sources: urlList.optional(),
  })
  .strict()
  .refine((post) => !post.updated || post.updated >= post.date, {
    message: 'updated não pode ser anterior a date',
    path: ['updated'],
  })

export const noteFrontmatterSchema = z
  .object({
    slug: slugSchema,
    title: nonEmpty,
    kicker: nonEmpty,
    date: isoDateSchema,
    updated: isoDateSchema.optional(),
    excerpt: nonEmpty,
    published: booleanString,
    locale: localeSchema.default('pt-BR'),
    sources: urlList.optional(),
  })
  .strict()

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>
export type NoteFrontmatter = z.infer<typeof noteFrontmatterSchema>

export const projectStatusSchema = z.enum(['active', 'published', 'experimental', 'study'])

export const projectSchema = z
  .object({
    slug: slugSchema,
    name: nonEmpty,
    repo: httpsUrlSchema,
    docs: httpsUrlSchema,
    technologies: z.array(nonEmpty).min(1),
    /** Ano de criação do repositório público. */
    year: z.string().regex(/^\d{4}$/),
    status: projectStatusSchema,
    /** Quando o status foi conferido e onde (evidência pública). */
    statusCheckedAt: isoDateSchema,
    evidence: z.array(httpsUrlSchema).min(1),
  })
  .strict()

export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>

export const bookSchema = z
  .object({ title: nonEmpty, author: nonEmpty, image: httpsUrlSchema, link: httpsUrlSchema, affiliate: z.boolean() })
  .strict()

export const boardGameSchema = z
  .object({ title: nonEmpty, note: nonEmpty, players: nonEmpty, image: z.string().regex(/^\/[\w/.-]+$/) })
  .strict()

export const badgeSchema = z
  .object({
    name: nonEmpty,
    issuer: nonEmpty,
    image: httpsUrlSchema,
    url: httpsUrlSchema,
    issuedAt: z.string().regex(/^\d{4}$/),
  })
  .strict()

export const authorSchema = z
  .object({ username: nonEmpty, name: nonEmpty, avatar: z.string().startsWith('/'), bio: nonEmpty })
  .strict()

export const socialLinkSchema = z.object({ label: nonEmpty, href: httpsUrlSchema }).strict()

// ── Front matter ───────────────────────────────────────────────────────

/** Front matter plano `chave: valor` (formato herdado do site React; sem YAML aninhado). */
export function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!match) throw new Error('Markdown precisa começar com front matter entre ---')
  const data: Record<string, string> = {}
  for (const line of (match[1] ?? '').split(/\r?\n/)) {
    if (line.trim() === '') continue
    const separator = line.indexOf(':')
    if (separator === -1) throw new Error(`Linha de front matter inválida: "${line}"`)
    data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return { data, body: match[2] ?? '' }
}

export function formatIssues(file: string, error: z.ZodError): string {
  return error.issues.map((issue) => `  ${file}: [${issue.path.join('.') || '(raiz)'}] ${issue.message}`).join('\n')
}

// ── Pares de tradução ───────────────────────────────────────────────────

type PairEntry = { file: string; locale: string; translationKey: string; slug: string; date: string; cover?: string; author?: string; published: boolean }

/** Campos invariantes entre PT e EN do mesmo texto. Retorna mensagens de erro (vazio = ok). */
export function validateTranslationPairs(entries: PairEntry[]): string[] {
  const errors: string[] = []
  const byKey = new Map<string, PairEntry[]>()
  for (const entry of entries) byKey.set(entry.translationKey, [...(byKey.get(entry.translationKey) ?? []), entry])
  for (const [key, group] of byKey) {
    const locales = group.map((entry) => entry.locale)
    if (new Set(locales).size !== locales.length) errors.push(`translationKey "${key}" repete o mesmo idioma: ${group.map((e) => e.file).join(', ')}`)
    const [first, ...rest] = group
    if (!first) continue
    for (const other of rest) {
      for (const field of ['slug', 'date', 'cover', 'author', 'published'] as const) {
        if (String(first[field]) !== String(other[field])) {
          errors.push(`${first.file} ↔ ${other.file}: campo "${field}" diverge ("${first[field]}" vs "${other[field]}")`)
        }
      }
    }
  }
  return errors
}
