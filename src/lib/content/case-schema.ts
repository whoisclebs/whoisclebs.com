/**
 * Schema Zod dos estudos de caso. Autocontido (só `zod` e `schema.ts`) para rodar também no
 * `scripts/validate-editorial.mjs` antes do build.
 *
 * O case é texto meu, em primeira pessoa, com títulos de seção livres. O que o schema ainda garante:
 * todo link (no corpo, nas fontes opcionais, no diagrama, nos trechos e nas medições) é https em
 * github.com ou no próprio site; todo trecho de código tem permalink fixado na revisão do case, com as
 * mesmas linhas; diagrama e trechos aparecem uma vez, numa seção que os chama em `figures`.
 */
import { z } from 'zod'
import { isoDateSchema, slugSchema } from './schema.ts'

const ALLOWED_HOSTS = new Set(['github.com', 'whoisclebs.com'])

export function isAllowedSourceUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname) && url.username === '' && url.port === ''
  } catch {
    return false
  }
}

const nonEmpty = z.string().trim().min(1)
const sha = z.string().regex(/^[0-9a-f]{40}$/, 'commit precisa do SHA completo (40 hex)')

export const sourceUrlSchema = z.string().refine(isAllowedSourceUrl, 'fonte precisa ser https em github.com ou whoisclebs.com')

export const caseSourceSchema = z.object({ label: nonEmpty, url: sourceUrlSchema }).strict()

/** Link embutido no corpo: `[texto](url)`. A URL passa pela mesma regra das fontes. */
export const INLINE_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g

export function inlineLinks(text: string): Array<{ label: string; url: string }> {
  return [...text.matchAll(INLINE_LINK_RE)].map((match) => ({ label: match[1] as string, url: match[2] as string }))
}

/** Peças que uma seção mostra depois do texto: o diagrama, os trechos de código ou as medições. */
export const CASE_FIGURES = ['architecture', 'snippets', 'measurements'] as const
export type CaseFigure = (typeof CASE_FIGURES)[number]

const bodyParagraph = nonEmpty.superRefine((text, ctx) => {
  for (const link of inlineLinks(text)) {
    if (!isAllowedSourceUrl(link.url)) ctx.addIssue({ code: 'custom', message: `link "${link.label}" precisa ser https em github.com ou whoisclebs.com (${link.url})` })
  }
})

export const caseSectionSchema = z
  .object({
    /** Âncora da seção (único no case). */
    id: slugSchema,
    /** Título livre, escolhido pelo case. */
    title: nonEmpty,
    body: z.array(bodyParagraph),
    /** Links extras, fora do texto. Opcional. */
    sources: z.array(caseSourceSchema).optional(),
    figures: z.array(z.enum(CASE_FIGURES)).optional(),
  })
  .strict()
  .refine((section) => section.body.length > 0 || (section.figures?.length ?? 0) > 0, 'seção precisa de texto ou de uma figura')

export const architectureNodeSchema = z
  .object({
    label: nonEmpty,
    detail: nonEmpty,
    /** `solid`: existe no código. `gap`: prometido ou ausente (desenhado tracejado, com texto dizendo). */
    state: z.enum(['solid', 'gap']),
    source: caseSourceSchema,
  })
  .strict()

/** Permalink de blob fixado num commit, com âncora de linhas: /owner/repo/blob/<sha>/<file>#Lx-Ly */
const BLOB_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/blob\/([0-9a-f]{40})\/([\w./-]+)#L(\d+)(?:-L(\d+))?$/

export const snippetSchema = z
  .object({
    title: nonEmpty,
    file: nonEmpty,
    lines: z.tuple([z.number().int().positive(), z.number().int().positive()]),
    lang: z.enum(['go']),
    url: sourceUrlSchema,
    code: nonEmpty,
    caption: nonEmpty,
  })
  .strict()
  .superRefine((snippet, ctx) => {
    const match = BLOB_RE.exec(snippet.url)
    if (!match) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'trecho precisa de permalink /blob/<sha de 40 hex>/<arquivo>#Lx-Ly' })
      return
    }
    const [, , file, start, end] = match
    const [first, last] = snippet.lines
    if (file !== snippet.file) ctx.addIssue({ code: 'custom', path: ['url'], message: `arquivo do link (${file}) difere de "${snippet.file}"` })
    if (Number(start) !== first || Number(end ?? start) !== last) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: `âncora L${start}-L${end ?? start} difere das linhas ${first}-${last}` })
    }
    if (last < first) ctx.addIssue({ code: 'custom', path: ['lines'], message: 'linha final antes da inicial' })
    const count = snippet.code.split('\n').length
    if (count !== last - first + 1) {
      ctx.addIssue({ code: 'custom', path: ['code'], message: `o trecho tem ${count} linhas, mas o intervalo ${first}-${last} tem ${last - first + 1}` })
    }
  })

/** Medição que eu rodei: comando, ambiente, data e resultado. Sem isso, não entra. */
export const measurementSchema = z
  .object({
    command: nonEmpty,
    environment: nonEmpty,
    date: isoDateSchema,
    /** Continua a frase "Rodei `comando`: …". */
    result: nonEmpty,
  })
  .strict()

export const caseStudySchema = z
  .object({
    slug: slugSchema,
    title: nonEmpty,
    /** Resumo em uma ou duas frases (meta description, /projetos/, llms.txt, MCP). Texto puro. */
    dek: nonEmpty,
    /** Quando conferi o texto contra o código (dateModified do JSON-LD e lastmod do sitemap). */
    checkedAt: isoDateSchema,
    /** Revisão do código lida para escrever o case (todas as linhas citadas são desta revisão). */
    revision: z.object({ sha, date: isoDateSchema, url: sourceUrlSchema }).strict(),
    sections: z.array(caseSectionSchema).min(1),
    architecture: z.object({ caption: nonEmpty, nodes: z.array(architectureNodeSchema).min(2) }).strict(),
    snippets: z.array(snippetSchema).min(1),
    measurements: z.array(measurementSchema),
  })
  .strict()
  .superRefine((study, ctx) => {
    const ids = study.sections.map((section) => section.id)
    for (const [index, id] of ids.entries()) {
      if (ids.indexOf(id) !== index) ctx.addIssue({ code: 'custom', path: ['sections', index, 'id'], message: `id de seção repetido: ${id}` })
    }
    const figures = study.sections.flatMap((section) => section.figures ?? [])
    const required: CaseFigure[] = ['architecture', 'snippets', ...(study.measurements.length > 0 ? (['measurements'] as const) : [])]
    for (const figure of CASE_FIGURES) {
      const count = figures.filter((item) => item === figure).length
      const expected = required.includes(figure) ? 1 : 0
      if (count !== expected) ctx.addIssue({ code: 'custom', path: ['sections'], message: `"${figure}" precisa aparecer em ${expected} seção(ões) (aparece em ${count})` })
    }
    for (const [index, snippet] of study.snippets.entries()) {
      if (!snippet.url.includes(`/blob/${study.revision.sha}/`)) {
        ctx.addIssue({ code: 'custom', path: ['snippets', index, 'url'], message: 'trecho precisa apontar para a revisão do case' })
      }
    }
  })

export type CaseStudyInput = z.input<typeof caseStudySchema>
export type CaseStudy = z.infer<typeof caseStudySchema>
export type CaseSection = z.infer<typeof caseSectionSchema>
export type CaseSource = z.infer<typeof caseSourceSchema>
