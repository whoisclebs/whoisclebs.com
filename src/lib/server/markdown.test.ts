import { describe, expect, it } from 'vitest'
import { renderMarkdown, slugifyHeading } from './markdown'

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

  it('escapa HTML cru e renderiza código inline', async () => {
    const { html } = await renderMarkdown('Use `<seu_usuario>.github.io` e <script>alert(1)</script>')
    expect(html).toContain('<code>&lt;seu_usuario&gt;.github.io</code>')
    expect(html).not.toContain('<script>')
  })

  it('normaliza slug', () => {
    expect(slugifyHeading('Passo 1: Configurar o Workflow')).toBe('passo-1-configurar-o-workflow')
  })
})
