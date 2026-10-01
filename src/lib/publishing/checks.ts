/**
 * Conferências da camada legível por agentes sobre o HTML/texto já gerado. Autocontido (sem imports) para
 * rodar em três lugares com a mesma regra: testes (Vitest), o portão do build
 * (`scripts/verify-publishing.mjs`, Node com remoção de tipos) e o e2e (Playwright).
 */

export const SITE_ORIGIN = 'https://whoisclebs.com'

/** Endpoint MCP somente leitura (Streamable HTTP; `src/routes/mcp/+server.ts`). */
export const MCP_PATH = '/mcp'

/**
 * Endpoints dinâmicos (sem página prerenderizada) que `/llms*.txt` podem citar. O portão do build exige que
 * cada um exista como rota no manifesto do servidor; o e2e confere que responde.
 */
export const DYNAMIC_ENDPOINTS: readonly string[] = [MCP_PATH]

export function dynamicEndpointFor(url: string): string | undefined {
  return DYNAMIC_ENDPOINTS.find((path) => url === `${SITE_ORIGIN}${path}`)
}

/** A rota existe no manifesto gerado pelo SvelteKit (`.svelte-kit/output/server/manifest.js`)? */
export function manifestHasRoute(manifestSource: string, path: string): boolean {
  return manifestSource.includes(`id: ${JSON.stringify(path)}`)
}

export type JsonLdNode = Record<string, unknown> & { '@type'?: string | string[] }

/** Página extraída do HTML: o que uma pessoa vê e contra o que o JSON-LD é comparado. */
export type PageFacts = {
  lang: string
  canonical: string
  h1: string
  /** Texto visível (sem `<script>`, `<style>` e tags), com espaços normalizados. */
  text: string
  /** Valores de `<time datetime>` da página. */
  times: string[]
}

const ARTICLE_TYPES = new Set(['Article', 'BlogPosting', 'TechArticle'])
const PAGE_TYPES = new Set(['ProfilePage', 'ContactPage', 'WebPage', 'CollectionPage'])

/** Campos obrigatórios por tipo (Google Search Central + o que o site promete em cada nó). */
export const REQUIRED_FIELDS: Record<string, readonly string[]> = {
  Person: ['name', 'url'],
  WebSite: ['name', 'url', 'inLanguage'],
  ProfilePage: ['mainEntity', 'url', 'inLanguage'],
  ContactPage: ['mainEntity', 'url', 'inLanguage'],
  WebPage: ['name', 'url', 'inLanguage'],
  CollectionPage: ['name', 'url', 'inLanguage'],
  BlogPosting: ['headline', 'author', 'url', 'inLanguage', 'datePublished'],
  TechArticle: ['headline', 'author', 'url', 'inLanguage'],
  SoftwareSourceCode: ['name', 'codeRepository', 'programmingLanguage'],
  BreadcrumbList: ['itemListElement'],
}

/** Tipos que o site nunca publica (nada de avaliações, preços, vagas ou ofertas inventadas). */
export const FORBIDDEN_KEYS = ['review', 'aggregateRating', 'offers', 'price', 'worksFor', 'JobPosting', 'Offer', 'Review', 'AggregateRating']

export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

export function extractPageFacts(html: string): PageFacts {
  const body = html.slice(html.indexOf('<body'))
  const visible = body.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(visible)?.[1] ?? ''
  return {
    lang: /<html[^>]*\slang="([^"]+)"/.exec(html)?.[1] ?? '',
    canonical: /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? '',
    h1: stripTags(h1),
    text: stripTags(visible),
    times: [...visible.matchAll(/<time[^>]*\sdatetime="([^"]+)"/g)].map((match) => match[1] as string),
  }
}

/** Blocos `application/ld+json` já parseados. Lança erro com o trecho se algum não for JSON válido. */
export function extractJsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => {
    try {
      return JSON.parse(match[1] as string) as unknown
    } catch (error) {
      throw new Error(`JSON-LD inválido: ${(error as Error).message}: ${(match[1] as string).slice(0, 120)}`, { cause: error })
    }
  })
}

/** Nós de primeiro nível (abre `@graph`). */
export function graphNodes(blocks: unknown[]): JsonLdNode[] {
  return blocks.flatMap((block) => {
    const record = block as Record<string, unknown>
    return Array.isArray(record['@graph']) ? (record['@graph'] as JsonLdNode[]) : [record as JsonLdNode]
  })
}

function typesOf(node: JsonLdNode): string[] {
  const type = node['@type']
  return Array.isArray(type) ? type : type ? [type] : []
}

function containsKey(value: unknown, keys: readonly string[]): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = containsKey(item, keys)
      if (found) return found
    }
    return undefined
  }
  if (value && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) {
      if (keys.includes(key)) return key
      if (key === '@type' && typeof inner === 'string' && keys.includes(inner)) return inner
      const found = containsKey(inner, keys)
      if (found) return found
    }
  }
  return undefined
}

const lower = (value: string) => value.toLocaleLowerCase('pt-BR')

/**
 * Problemas de um conjunto de blocos JSON-LD contra a página: contexto, campos obrigatórios, chaves
 * proibidas e coerência com o texto visível (título = H1, nomes e cargo aparecem, datas = `<time>`,
 * URL = canonical, idioma = `<html lang>`). Lista vazia = ok.
 */
export function jsonLdIssues(blocks: unknown[], page: PageFacts): string[] {
  const issues: string[] = []
  if (blocks.length === 0) return ['nenhum bloco JSON-LD']
  for (const block of blocks) {
    if ((block as Record<string, unknown>)['@context'] !== 'https://schema.org') issues.push('@context diferente de https://schema.org')
  }
  const forbidden = containsKey(blocks, FORBIDDEN_KEYS)
  if (forbidden) issues.push(`chave proibida no JSON-LD: ${forbidden}`)
  const text = lower(page.text)
  const seen = (value: unknown) => typeof value === 'string' && text.includes(lower(value))

  for (const node of graphNodes(blocks)) {
    for (const type of typesOf(node)) {
      for (const field of REQUIRED_FIELDS[type] ?? []) {
        const value = node[field]
        if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) issues.push(`${type} sem ${field}`)
      }
      if (ARTICLE_TYPES.has(type)) {
        if (node.headline !== page.h1) issues.push(`${type}.headline "${String(node.headline)}" ≠ H1 "${page.h1}"`)
        for (const field of ['datePublished', 'dateModified']) {
          const date = node[field]
          if (date !== undefined && !page.times.includes(String(date))) issues.push(`${type}.${field} ${String(date)} não aparece em <time datetime>`)
        }
        if (!node.datePublished && !node.dateModified) issues.push(`${type} sem datePublished nem dateModified`)
      }
      if (ARTICLE_TYPES.has(type) || PAGE_TYPES.has(type)) {
        if (node.url !== page.canonical) issues.push(`${type}.url ${String(node.url)} ≠ canonical ${page.canonical}`)
        if (node.inLanguage !== page.lang) issues.push(`${type}.inLanguage ${String(node.inLanguage)} ≠ lang ${page.lang}`)
      }
      if ((type === 'WebPage' || type === 'CollectionPage') && node.name !== page.h1) issues.push(`${type}.name "${String(node.name)}" ≠ H1 "${page.h1}"`)
      if (type === 'WebPage' && node.dateModified !== undefined && !page.times.includes(String(node.dateModified))) {
        issues.push(`WebPage.dateModified ${String(node.dateModified)} não aparece em <time datetime>`)
      }
      if (type === 'ProfilePage' || type === 'ContactPage') {
        if (node.name !== page.h1) issues.push(`${type}.name "${String(node.name)}" ≠ H1 "${page.h1}"`)
        const person = node.mainEntity as JsonLdNode | undefined
        if (!person || !typesOf(person).includes('Person')) issues.push(`${type}.mainEntity não é Person`)
        else issues.push(...personIssues(person, seen))
      }
      if (type === 'Person') issues.push(...personIssues(node, seen))
      if (type === 'SoftwareSourceCode' && !seen(node.name)) issues.push(`SoftwareSourceCode.name "${String(node.name)}" não aparece na página`)
      if (type === 'BreadcrumbList') {
        const items = (node.itemListElement ?? []) as JsonLdNode[]
        items.forEach((item, index) => {
          if (item.position !== index + 1) issues.push(`BreadcrumbList: posição ${String(item.position)} fora de ordem`)
          if (typeof item.item !== 'string' || !item.item.startsWith(`${SITE_ORIGIN}/`)) issues.push(`BreadcrumbList: item sem URL absoluta (${String(item.name)})`)
        })
        const last = items.at(-1)
        if (last?.name !== page.h1) issues.push(`BreadcrumbList: último item "${String(last?.name)}" ≠ H1 "${page.h1}"`)
        if (last?.item !== page.canonical) issues.push(`BreadcrumbList: último item ${String(last?.item)} ≠ canonical ${page.canonical}`)
      }
    }
  }
  return issues
}

function personIssues(person: JsonLdNode, seen: (value: unknown) => boolean): string[] {
  const issues: string[] = []
  if (!seen(person.name) && !seen(person.alternateName)) issues.push(`Person.name "${String(person.name)}" não aparece na página`)
  const sameAs = person.sameAs
  if (sameAs !== undefined && (!Array.isArray(sameAs) || sameAs.some((url) => typeof url !== 'string' || !url.startsWith('https://')))) {
    issues.push('Person.sameAs precisa ser lista de URLs https')
  }
  return issues
}

/** Canonical absoluto no domínio, com barra final. */
export function canonicalIssue(canonical: string): string | undefined {
  if (!canonical.startsWith(`${SITE_ORIGIN}/`)) return `canonical não absoluto: "${canonical}"`
  if (!canonical.endsWith('/')) return `canonical sem barra final: "${canonical}"`
  return undefined
}

/** Remove blocos de código cercados (``` … ```): links dentro deles são exemplo, não navegação. */
function withoutFences(markdown: string): string {
  return markdown.replace(/^```[\s\S]*?^```/gm, '')
}

/**
 * URLs internas citadas num texto Markdown (links `[x](url)` e URLs soltas do domínio), fora de blocos
 * de código. Caminhos relativos viram absolutos. Âncoras são ignoradas.
 */
export function internalLinks(markdown: string): string[] {
  const source = withoutFences(markdown)
  const found = new Set<string>()
  for (const match of source.matchAll(/\]\(([^)\s]+)\)/g)) {
    const url = match[1] as string
    if (url.startsWith('/')) found.add(`${SITE_ORIGIN}${url}`)
    else if (url.startsWith(`${SITE_ORIGIN}/`) || url === SITE_ORIGIN) found.add(url)
  }
  for (const match of source.matchAll(/https:\/\/whoisclebs\.com(\/[^\s)<>"'`\]]*)?/g)) found.add(match[0].replace(/[.,;:]+$/, ''))
  return [...found].map((url) => url.split('#')[0] as string)
}

/** Links da "file list" de um llms.txt (seções H2 com itens `- [nome](url)`). */
export function llmsIndexIssues(markdown: string): string[] {
  const issues: string[] = []
  const lines = markdown.split('\n')
  if (!/^# \S/.test(lines[0] ?? '')) issues.push('llms.txt precisa começar com um H1')
  const firstContent = lines.slice(1).find((line) => line.trim() !== '')
  if (!firstContent?.startsWith('> ')) issues.push('llms.txt precisa de um resumo em blockquote logo depois do H1')
  if (lines.some((line) => /^#{3,} /.test(line))) issues.push('llms.txt só usa H1 e H2')
  if (lines.filter((line) => /^# /.test(line)).length !== 1) issues.push('llms.txt precisa de exatamente um H1')
  let inSection = false
  for (const line of lines) {
    if (line.startsWith('## ')) inSection = true
    else if (inSection && line.trim() !== '' && !/^- \[[^\]]+\]\(https:\/\/[^)\s]+\)(: .+)?$/.test(line)) issues.push(`linha fora do formato de file list: "${line}"`)
  }
  return issues
}

/** Caminho do arquivo prerenderizado que atende uma URL do site (`/x/` → `x/index.html`). */
export function builtFileFor(url: string): string | undefined {
  if (!url.startsWith(SITE_ORIGIN)) return undefined
  const path = decodeURI(url.slice(SITE_ORIGIN.length) || '/')
  if (path.endsWith('/')) return `${path.slice(1)}index.html`
  return path.slice(1)
}

export function sitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeEntities(match[1] as string))
}

/** Artigos (pt-BR e en) e notas: as páginas que têm versão Markdown servida ao lado da HTML. */
const MARKDOWN_ENTRY_PATH = /^\/(escrita|en\/writing|notas)\/(?!assunto\/|topic\/)[^/]+\/$/

/** URL da versão Markdown de uma página (`/escrita/x/` → `/escrita/x.md`), ou `undefined` se ela não tiver. */
export function markdownUrlFor(canonical: string): string | undefined {
  if (!canonical.startsWith(`${SITE_ORIGIN}/`)) return undefined
  const path = canonical.slice(SITE_ORIGIN.length)
  return MARKDOWN_ENTRY_PATH.test(path) ? `${SITE_ORIGIN}${path.slice(0, -1)}.md` : undefined
}

/** `href` do `<link rel="alternate" type="text/markdown">` do HTML, se houver. */
export function markdownAlternate(html: string): string | undefined {
  for (const match of html.matchAll(/<link\b[^>]*>/g)) {
    const tag = match[0]
    if (/\srel="alternate"/.test(tag) && /\stype="text\/markdown"/.test(tag)) return /\shref="([^"]+)"/.exec(tag)?.[1]
  }
  return undefined
}

/** Artigo e nota apontam para a própria `.md`; as demais páginas não anunciam versão Markdown. */
export function markdownAlternateIssue(html: string, canonical: string): string | undefined {
  const expected = markdownUrlFor(canonical)
  const found = markdownAlternate(html)
  if (!expected) return found ? `${canonical} não tem versão Markdown, mas anuncia ${found}` : undefined
  if (!found) return `sem <link rel="alternate" type="text/markdown"> (esperado ${expected})`
  return found === expected ? undefined : `<link rel="alternate" type="text/markdown"> aponta para ${found}, esperado ${expected}`
}

/** A `.md` abre com o título em H1, cita a página canônica e não repassa o front matter do arquivo-fonte. */
export function markdownDocumentIssues(markdown: string, canonical: string): string[] {
  const issues: string[] = []
  if (markdown.startsWith('---')) issues.push('front matter bruto no início do arquivo')
  if (!/^# \S/.test(markdown)) issues.push('a primeira linha precisa ser o título em H1')
  if (!markdown.includes(canonical)) issues.push(`não cita a página canônica ${canonical}`)
  return issues
}

/**
 * Crawlers de IA liberados por nome em `/robots.txt` (cada um com `Allow: /`). Nomes conferidos na
 * documentação de cada operador em 2026-10-01. Busca e resposta primeiro, treino depois.
 */
export const AI_CRAWLERS: readonly string[] = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User',
  'DuckAssistBot',
  'Applebot',
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Meta-ExternalAgent',
  'Amazonbot',
]

/** Grupos do robots.txt: agentes (minúsculos) e as regras do grupo, na ordem do arquivo. */
function robotsGroups(robots: string): Array<{ agents: string[]; rules: string[] }> {
  const groups: Array<{ agents: string[]; rules: string[] }> = []
  let current: { agents: string[]; rules: string[] } | undefined
  for (const raw of robots.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim()
    const field = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line)
    if (!field) continue
    const name = (field[1] as string).toLowerCase()
    const value = (field[2] as string).trim()
    if (name === 'user-agent') {
      if (!current || current.rules.length > 0) groups.push((current = { agents: [], rules: [] }))
      current.agents.push(value.toLowerCase())
    } else if (current && (name === 'allow' || name === 'disallow')) current.rules.push(`${name === 'allow' ? 'Allow' : 'Disallow'}: ${value}`)
  }
  return groups
}

/** O site libera tudo: grupo `*`, um grupo por crawler de IA, nenhum `Disallow: /` e o sitemap declarado. */
export function robotsIssues(robots: string): string[] {
  const issues: string[] = []
  const groups = robotsGroups(robots)
  const allows = (agent: string) => groups.some((group) => group.agents.includes(agent.toLowerCase()) && group.rules.includes('Allow: /'))
  if (!allows('*')) issues.push('sem o grupo "User-agent: *" com "Allow: /"')
  for (const crawler of AI_CRAWLERS) if (!allows(crawler)) issues.push(`${crawler} sem grupo próprio com "Allow: /"`)
  for (const group of groups) if (group.rules.includes('Disallow: /')) issues.push(`"Disallow: /" para ${group.agents.join(', ')}`)
  if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) issues.push('Sitemap não declarado')
  return issues
}
