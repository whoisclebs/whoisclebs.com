import { describe, expect, it } from 'vitest'
import { renderMarkdown, slugifyHeading, highlightCode, renderCaseText, renderInline } from './markdown'

describe('renderMarkdown', () => {
  it('gera ids de cabeçalho únicos e sumário', async () => {
    const { html, toc } = await renderMarkdown('## Pré-requisitos\n\ntexto\n\n## Pré-requisitos\n')
    expect(html).toContain('<h2 id="pre-requisitos">')
    expect(html).toContain('<h2 id="pre-requisitos-2">')
    expect(toc).toEqual([
      { id: 'pre-requisitos', text: 'Pré-requisitos' },
      { id: 'pre-requisitos-2', text: 'Pré-requisitos' },
    ])
  })

  it('destaca código no build com Shiki e aceita linguagem desconhecida', async () => {
    const { html } = await renderMarkdown('```yaml\nname: deploy\n```\n\n```text\n<b>x</b>\n```')
    expect(html).toContain('class="shiki')
    expect(html).toContain('--shiki-light')
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
  })

  it('bloco de código rolável é focável por teclado, com ou sem linguagem conhecida', async () => {
    const { html } = await renderMarkdown('```yaml\nname: deploy\n```\n\n```text\nx\n```')
    expect(html.match(/<pre[^>]*tabindex="0"/g)).toHaveLength(2)
  })

  it('escapa HTML cru e renderiza código inline', async () => {
    const { html } = await renderMarkdown('Use `<seu_usuario>.github.io` e <script>alert(1)</script>')
    expect(html).toContain('<code>&lt;seu_usuario&gt;.github.io</code>')
    expect(html).not.toContain('<script>')
  })

  it('normaliza slug', () => {
    expect(slugifyHeading('Passo 1: Configurar o Workflow')).toBe('passo-1-configurar-o-workflow')
  })
})

describe('highlightCode e renderInline (cases)', () => {
  it('destaca Go no build, numera a partir da linha real e deixa o bloco focável', async () => {
    const html = await highlightCode('func main() {\n}', 'go', 41)
    expect(html).toContain('shiki--numbered')
    expect(html).toContain('--line-start: 40')
    expect(html).toContain('tabindex="0"')
    expect(html.match(/class="line"/g)).toHaveLength(2)
  })

  it('escapa HTML e transforma só crases em code', () => {
    expect(renderInline('Use `http.Header.Add` <b>já</b>')).toBe('Use <code>http.Header.Add</code> &lt;b&gt;já&lt;/b&gt;')
  })

  it('no texto do case, [texto](url) vira link e o resto continua escapado', () => {
    const url = 'https://github.com/whoisclebs/tuxedo/blob/' + 'a'.repeat(40) + '/utils.go#L8-L12'
    expect(renderCaseText(`Veja [\`doClose\`](${url}) & <i>`)).toBe(`Veja <a href="${url}" rel="noopener noreferrer"><code>doClose</code></a> &amp; &lt;i&gt;`)
  })

  it('no texto do case, recusa link fora do GitHub e do próprio site', () => {
    expect(() => renderCaseText('[x](https://example.com/)')).toThrow(/fora de github/)
    expect(() => renderCaseText('[x](javascript:alert(1))')).toThrow()
  })
})
