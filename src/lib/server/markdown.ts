/**
 * Markdown → HTML no servidor/prerender (marked + Shiki). Nada disso vai para o cliente:
 * só é importado por +page.server.ts de rotas prerenderizadas.
 */
import { Marked, type Tokens } from 'marked'
import { createHighlighter, type Highlighter } from 'shiki'

export type TocItem = { id: string; text: string }
export type RenderedMarkdown = { html: string; toc: TocItem[] }

const languages = ['bash', 'css', 'dockerfile', 'html', 'javascript', 'js', 'json', 'typescript', 'ts', 'yaml', 'go', 'rust'] as const
let highlighterPromise: Promise<Highlighter> | undefined

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({ themes: ['github-light', 'github-dark'], langs: [...languages] })
  return highlighterPromise
}

export function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

export function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'secao'
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const highlighter = await getHighlighter()
  const loaded = new Set(highlighter.getLoadedLanguages())
  const toc: TocItem[] = []
  const seen = new Map<string, number>()

  const marked = new Marked({ gfm: true })
  marked.use({
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens)
        // O H1 é o título da página; cabeçalhos do corpo começam em H2.
        const level = Math.min(Math.max(depth, 2), 6)
        const base = slugifyHeading(text)
        const count = seen.get(base) ?? 0
        seen.set(base, count + 1)
        const id = count === 0 ? base : `${base}-${count + 1}`
        if (level === 2) toc.push({ id, text: text.replace(/[`*_]/g, '') })
        return `<h${level} id="${id}">${inner}</h${level}>\n`
      },
      code({ text, lang }: Tokens.Code) {
        const language = (lang ?? '').trim().split(/\s+/)[0]?.toLowerCase() || 'text'
        const label = escapeHtml(language)
        const body = loaded.has(language)
          ? highlighter.codeToHtml(text, { lang: language, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false })
          : `<pre class="shiki"><code>${escapeHtml(text)}</code></pre>`
        return `<figure class="code-block"><figcaption>${label}</figcaption>${body}</figure>\n`
      },
      // Conteúdo é Markdown puro: HTML cru é exibido como texto, nunca interpretado.
      html({ text }: Tokens.HTML | Tokens.Tag) {
        return escapeHtml(text)
      },
      link({ href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens)
        const external = /^https?:\/\//.test(href) && !href.startsWith('https://whoisclebs.com')
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
        const rel = external ? ' rel="noopener noreferrer"' : ''
        return `<a href="${escapeHtml(href)}"${titleAttr}${rel}>${inner}</a>`
      },
    },
  })

  const html = await marked.parse(markdown, { async: true })
  return { html, toc }
}
