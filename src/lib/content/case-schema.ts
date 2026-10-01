/**
 * Schema Zod dos estudos de caso. Autocontido (só `zod` e `schema.ts`) para rodar também no
 * `scripts/validate-editorial.mjs` antes do build.
 *
 * Regra de verdade editorial: toda seção, todo nó do diagrama, todo trecho de código e toda medição
 * carrega uma fonte pública (https em github.com ou no próprio site). Seção sem fonte derruba o build.
 */
import { z } from 'zod'
import { isoDateSchema, slugSchema } from './schema.ts'

/** Ordem fixa do template: Contexto → Restrições → Decisão → Arquitetura → Alternativas recusadas →
 * Resultado observado → O que mudaria → Código/demo. */
export const CASE_SECTION_IDS = ['contexto', 'restricoes', 'decisao', 'arquitetura', 'alternativas', 'resultado', 'mudaria', 'codigo'] as const
export type CaseSectionId = (typeof CASE_SECTION_IDS)[number]

export const CASE_SECTION_TITLES: Record<CaseSectionId, string> = {
  contexto: 'Contexto',
  restricoes: 'Restrições',
  decisao: 'Decisão',
  arquitetura: 'Arquitetura',
  alternativas: 'Alternativas recusadas',
  resultado: 'Resultado observado',
  mudaria: 'O que eu mudaria',
  codigo: 'Código e demo',
}

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

export const caseSectionSchema = z
  .object({
    id: z.enum(CASE_SECTION_IDS),
    /** `fonte`: o texto repete o que está escrito no repositório. `analise`: leitura minha do código,
     * em primeira pessoa, rotulada na página. As duas exigem fonte (o código analisado). */
    voice: z.enum(['fonte', 'analise']),
    body: z.array(nonEmpty).min(1),
    sources: z.array(caseSourceSchema).min(1, 'toda seção precisa de pelo menos uma fonte (sources)'),
  })
  .strict()

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
    what: nonEmpty,
    command: nonEmpty,
    environment: nonEmpty,
    date: isoDateSchema,
    result: nonEmpty,
    source: caseSourceSchema,
  })
  .strict()

export const caseStudySchema = z
  .object({
    slug: slugSchema,
    title: nonEmpty,
    dek: nonEmpty,
    /** A pergunta que o case responde, em uma frase (usada na home e em /projetos/). */
    question: nonEmpty,
    /** Quando as fontes foram conferidas. */
    checkedAt: isoDateSchema,
    /** Revisão do código lida para escrever o case (todas as linhas citadas são desta revisão). */
    revision: z.object({ sha, date: isoDateSchema, url: sourceUrlSchema }).strict(),
    sections: z.array(caseSectionSchema),
    architecture: z.object({ caption: nonEmpty, nodes: z.array(architectureNodeSchema).min(2) }).strict(),
    snippets: z.array(snippetSchema).min(1),
    measurements: z.array(measurementSchema),
  })
  .strict()
  .superRefine((study, ctx) => {
    const ids = study.sections.map((section) => section.id)
    if (ids.join() !== CASE_SECTION_IDS.join()) {
      ctx.addIssue({ code: 'custom', path: ['sections'], message: `seções precisam ser exatamente ${CASE_SECTION_IDS.join(' → ')} (recebido: ${ids.join(' → ')})` })
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
