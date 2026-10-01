import { describe, expect, it } from 'vitest'
import type { TerminalCatalog } from '../terminal/catalog'
import { bootLines, drawerApps, isOpen, step, type Machine } from './model'

const catalog: TerminalCatalog = {
  locale: 'pt-BR',
  pages: [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'writing', label: 'Artigos', href: '/escrita/' },
    { key: 'notes', label: 'Notas', href: '/notas/' },
    { key: 'projects', label: 'Projetos', href: '/projetos/' },
    { key: 'about', label: 'Sobre', href: '/sobre/' },
    { key: 'contact', label: 'Contato', href: '/contato/' },
    { key: 'books', label: 'Livros', href: '/livros/' },
    { key: 'hobbies', label: 'Hobbies', href: '/hobbies/' },
  ],
  articles: [
    { slug: 'a', title: 'A', href: '/escrita/a/', date: '2026-05-01', topic: 'X' },
    { slug: 'b', title: 'B', href: '/escrita/b/', date: '2026-05-02', topic: 'X' },
  ],
  notes: [{ slug: 'n', title: 'N', href: '/notas/n/', date: '2026-04-02' }],
  projects: [{ slug: 'p', name: 'p', description: '', status: '', language: '', href: '/projetos/p/', repo: '', lastCommit: '' }],
  boardGames: [],
  books: [],
  social: [
    { label: 'GitHub', href: 'https://github.com/whoisclebs' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/whoisclebs' },
    { label: 'YouTube', href: 'https://www.youtube.com/@whoisclebs' },
    { label: 'Substack', href: 'https://whoisclebs.substack.com' },
  ],
  email: 'oi@exemplo.com',
  about: [],
  now: { items: [], updatedAt: '' },
  machine: [
    { path: '/mcp', note: '' },
    { path: '/rss/blog.xml', note: '' },
  ],
}

const labels = {
  boot: { articles: 'artigos', notes: 'notas', projects: 'projetos', pages: 'páginas', build: 'build', noData: 'sem dado' },
  apps: { rss: 'RSS', snake: 'Snake', dice: 'Dados', neon: 'Neon', scene: 'Cena' },
}

const closed: Machine = { phase: 'closed', booted: false }

describe('máquina de estados do aparelho', () => {
  it('abre, dá boot uma vez e liga', () => {
    let m = step(closed, 'toggle')
    expect(m.phase).toBe('opening')
    m = step(m, 'settled')
    expect(m.phase).toBe('boot')
    m = step(m, 'booted')
    expect(m).toEqual({ phase: 'on', booted: true })
  })

  it('fecha a partir de qualquer pose aberta e assenta fechado', () => {
    for (const phase of ['opening', 'boot', 'on'] as const) {
      expect(step({ phase, booted: false }, 'toggle').phase).toBe('closing')
      expect(step({ phase, booted: false }, 'close').phase).toBe('closing')
    }
    expect(step({ phase: 'closing', booted: true }, 'settled')).toEqual({ phase: 'closed', booted: true })
  })

  it('aceita ser interrompido: clicar de novo enquanto fecha volta a abrir', () => {
    expect(step({ phase: 'closing', booted: false }, 'toggle').phase).toBe('opening')
  })

  it('na segunda abertura pula o boot', () => {
    const m = step(step({ phase: 'closed', booted: true }, 'toggle'), 'settled')
    expect(m.phase).toBe('on')
  })

  it('com movimento reduzido ou economia de dados não dá boot', () => {
    const m = step(step(closed, 'toggle'), 'settled', { quiet: true })
    expect(m).toEqual({ phase: 'on', booted: true })
  })

  it('ignora eventos fora de hora', () => {
    expect(step(closed, 'close')).toEqual(closed)
    expect(step(closed, 'settled')).toEqual(closed)
    expect(step(closed, 'booted')).toEqual(closed)
    expect(step({ phase: 'on', booted: true }, 'settled').phase).toBe('on')
    // Um `booted` atrasado de um boot já interrompido não religa nada.
    expect(step({ phase: 'closing', booted: false }, 'booted').phase).toBe('closing')
  })

  it('isOpen vale para as poses que mostram a tela aberta ou abrindo', () => {
    expect(isOpen('closed')).toBe(false)
    expect(isOpen('closing')).toBe(false)
    expect(isOpen('opening')).toBe(true)
    expect(isOpen('boot')).toBe(true)
    expect(isOpen('on')).toBe(true)
  })
})

describe('linhas de boot', () => {
  it('contam o que o catálogo carregou de verdade e o commit do build', () => {
    const lines = bootLines(catalog, { sha: 'f'.repeat(40), short: 'fffffff', url: '' }, labels.boot)
    expect(lines).toEqual([
      { label: 'artigos', value: '2' },
      { label: 'notas', value: '1' },
      { label: 'projetos', value: '1' },
      { label: 'páginas', value: '8' },
      { label: 'build', value: 'fffffff' },
    ])
  })

  it('sem build diz sem dado; sem notas (inglês) não mostra a linha', () => {
    const lines = bootLines({ ...catalog, notes: [] }, null, labels.boot)
    expect(lines.find((line) => line.label === 'notas')).toBeUndefined()
    expect(lines.at(-1)).toEqual({ label: 'build', value: 'sem dado' })
    expect(lines.length).toBe(4)
  })

  it('a versão compacta (celular) fica em três linhas', () => {
    const lines = bootLines(catalog, null, labels.boot, { compact: true })
    expect(lines.map((line) => line.label)).toEqual(['artigos', 'projetos', 'build'])
  })
})

describe('gaveta de aplicativos', () => {
  const apps = drawerApps(catalog, labels.apps)

  it('traz as páginas do catálogo (sem a home), na ordem da gaveta', () => {
    const pages = apps.filter((app) => app.kind === 'link' && app.id.startsWith('page-'))
    expect(pages.map((app) => app.label)).toEqual(['Artigos', 'Projetos', 'Sobre', 'Notas', 'Livros', 'Hobbies', 'Contato'])
  })

  it('o RSS vem das rotas de máquina e os perfis são links externos', () => {
    expect(apps.find((app) => app.id === 'rss')).toMatchObject({ kind: 'feed', href: '/rss/blog.xml', glyph: 'rss' })
    const external = apps.filter((app) => app.kind === 'external')
    expect(external.map((app) => app.glyph)).toEqual(['github', 'linkedin', 'video', 'letter'])
  })

  it('os brinquedos levam às páginas certas ou disparam ações', () => {
    expect(apps.find((app) => app.id === 'snake')).toMatchObject({ kind: 'link', href: '/sobre/' })
    expect(apps.find((app) => app.id === 'dice')).toMatchObject({ kind: 'link', href: '/hobbies/' })
    expect(apps.find((app) => app.id === 'neon')).toMatchObject({ kind: 'action', action: 'neon' })
    expect(apps.find((app) => app.id === 'scene')).toMatchObject({ kind: 'action', action: 'scene' })
  })

  it('não inventa app para página que não existe no idioma', () => {
    const en = drawerApps({ ...catalog, pages: catalog.pages.filter((page) => page.key !== 'notes' && page.key !== 'hobbies') }, labels.apps)
    expect(en.some((app) => app.id === 'page-notes')).toBe(false)
    expect(en.some((app) => app.id === 'dice')).toBe(false)
  })

  it('ids únicos', () => {
    expect(new Set(apps.map((app) => app.id)).size).toBe(apps.length)
  })
})
