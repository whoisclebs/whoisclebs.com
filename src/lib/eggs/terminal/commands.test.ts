import { describe, expect, it } from 'vitest'
import { getMessages } from '$lib/i18n'
import type { TerminalCatalog } from './catalog'
import { complete, run, unknownCommand, visibleCommands, type Line, type TerminalContext } from './commands'

const catalog: TerminalCatalog = {
  locale: 'pt-BR',
  pages: [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'writing', label: 'Artigos', href: '/escrita/' },
    { key: 'about', label: 'Sobre', href: '/sobre/' },
    { key: 'books', label: 'Livros', href: '/livros/' },
  ],
  articles: [{ slug: 'idempotencia', title: 'Idempotência na prática', href: '/escrita/idempotencia/', date: '2026-05-01', topic: 'Pagamentos' }],
  notes: [{ slug: 'wasm', title: 'Uma nota sobre WASM', href: '/notas/wasm/', date: '2026-04-02' }],
  projects: [
    { slug: 'tuxedo', name: 'tuxedo', description: 'Cliente HTTP para Go.', status: 'ativo', language: 'Go', href: '/projetos/tuxedo/', repo: 'https://github.com/x/tuxedo', lastCommit: '2026-03-01' },
  ],
  boardGames: [{ title: 'Clank!', players: '2–4 jogadores' }],
  books: [{ title: 'Refactoring', author: 'Martin Fowler' }],
  social: [{ label: 'GitHub', href: 'https://github.com/whoisclebs' }],
  email: 'oi@exemplo.com',
  about: ['Primeiro parágrafo.', 'Segundo parágrafo.'],
  now: { items: [{ label: 'Construindo', text: 'Um orquestrador.' }], updatedAt: '2026-07-02' },
  machine: [
    { path: '/mcp', note: 'servidor MCP' },
    { path: '/llms.txt', note: 'índice' },
    { path: '/llms-full.txt', note: 'completo' },
    { path: '/resume.json', note: 'currículo' },
    { path: '/rss/blog.xml', note: 'feed' },
    { path: '/sitemap.xml', note: 'mapa' },
  ],
}

function ctx(overrides: Partial<TerminalContext> = {}): TerminalContext {
  return {
    catalog,
    t: getMessages('pt-BR').eggs,
    history: [],
    elapsedMs: 75_400,
    now: new Date('2026-10-01T12:00:00Z'),
    build: null,
    neon: false,
    random: () => 0.5,
    ...overrides,
  }
}

const text = (lines: Line[]) => lines.map((line) => line.map((segment) => segment.text).join('')).join('\n')
const links = (lines: Line[]) => lines.flatMap((line) => line.flatMap((segment) => (segment.href ? [segment.href] : [])))

describe('run', () => {
  it('linha vazia não produz nada', () => {
    expect(run('   ', ctx())).toEqual({ lines: [] })
  })

  it('help lista os comandos visíveis', () => {
    const out = text(run('help', ctx()).lines)
    for (const name of ['help', 'ls', 'cat', 'open', 'roll', 'hero', 'mcp']) expect(out).toContain(name)
    expect(out).not.toContain('sudo')
  })

  it('aceita sinônimos em português e maiúsculas', () => {
    expect(text(run('AJUDA', ctx()).lines)).toBe(text(run('help', ctx()).lines))
    expect(run('limpar', ctx()).effect).toEqual({ type: 'clear' })
  })

  it('clear pede para limpar', () => {
    expect(run('clear', ctx())).toEqual({ lines: [], effect: { type: 'clear' } })
  })

  it('history numera os comandos da sessão', () => {
    expect(text(run('history', ctx({ history: ['ls', 'help'] })).lines)).toBe('  1  ls\n  2  help')
  })

  it('echo repete o texto', () => {
    expect(text(run('echo  oi   mundo', ctx()).lines)).toBe('oi   mundo')
  })

  it('uptime usa o tempo medido', () => {
    expect(text(run('uptime', ctx()).lines)).toContain('1min 15s')
    expect(text(run('uptime', ctx({ elapsedMs: 9_900 })).lines)).toContain('9s')
  })

  it('build mostra o commit com link, ou "sem dado"', () => {
    const sha = 'a'.repeat(40)
    const result = run('build', ctx({ build: { sha, short: 'aaaaaaa', url: `https://github.com/x/commit/${sha}` } }))
    expect(text(result.lines)).toContain('aaaaaaa')
    expect(links(result.lines)).toEqual([`https://github.com/x/commit/${sha}`])
    expect(text(run('build', ctx()).lines)).toContain('sem dado')
  })

  it('whoami usa o texto do Sobre', () => {
    expect(text(run('whoami', ctx()).lines)).toContain('Primeiro parágrafo.')
  })

  it('ls sem argumento lista diretórios e arquivos', () => {
    const out = text(run('ls', ctx()).lines)
    expect(out).toContain('artigos/')
    expect(out).toContain('sobre.txt')
  })

  it('ls de cada diretório usa o catálogo, com links', () => {
    expect(links(run('ls artigos', ctx()).lines)).toEqual(['/escrita/idempotencia/'])
    expect(links(run('ls notas', ctx()).lines)).toEqual(['/notas/wasm/'])
    expect(links(run('ls projetos', ctx()).lines)).toEqual(['/projetos/tuxedo/'])
    expect(links(run('ls páginas', ctx()).lines)).toEqual(['/', '/escrita/', '/sobre/', '/livros/'])
    expect(links(run('ls articles/', ctx()).lines)).toEqual(['/escrita/idempotencia/'])
  })

  it('ls de diretório inexistente é erro', () => {
    const [line] = run('ls xpto', ctx()).lines
    expect(line?.[0]?.tone).toBe('error')
  })

  it('cat lê os arquivos', () => {
    expect(text(run('cat sobre.txt', ctx()).lines)).toContain('Segundo parágrafo.')
    expect(text(run('cat agora.txt', ctx()).lines)).toContain('Um orquestrador.')
    expect(links(run('cat contato.txt', ctx()).lines)).toContain('mailto:oi@exemplo.com')
    expect(run('cat nada.txt', ctx()).lines[0]?.[0]?.tone).toBe('error')
    expect(text(run('cat', ctx()).lines)).toContain('uso')
  })

  it('open e cd navegam por página, rótulo ou slug', () => {
    expect(run('open sobre', ctx()).effect).toEqual({ type: 'navigate', href: '/sobre/' })
    expect(run('cd artigos', ctx()).effect).toEqual({ type: 'navigate', href: '/escrita/' })
    expect(run('cd /livros/', ctx()).effect).toEqual({ type: 'navigate', href: '/livros/' })
    expect(run('open idempotencia', ctx()).effect).toEqual({ type: 'navigate', href: '/escrita/idempotencia/' })
    expect(run('open tuxedo', ctx()).effect).toEqual({ type: 'navigate', href: '/projetos/tuxedo/' })
    expect(run('cd ~', ctx()).effect).toEqual({ type: 'navigate', href: '/' })
    expect(run('cd', ctx()).effect).toEqual({ type: 'navigate', href: '/' })
    expect(run('open lugar-nenhum', ctx()).effect).toBeUndefined()
  })

  it('atalhos de lista: projects, articles, notes, now, contact, games, books', () => {
    expect(links(run('projects', ctx()).lines)).toContain('/projetos/tuxedo/')
    expect(links(run('artigos', ctx()).lines)).toContain('/escrita/idempotencia/')
    expect(links(run('notes', ctx()).lines)).toContain('/notas/wasm/')
    expect(text(run('agora', ctx()).lines)).toContain('Construindo')
    expect(links(run('social', ctx()).lines)).toContain('https://github.com/whoisclebs')
    expect(text(run('jogos', ctx()).lines)).toContain('Clank!')
    expect(text(run('books', ctx()).lines)).toContain('Martin Fowler')
  })

  it('notes no inglês avisa que só existem em português', () => {
    const en = { ...catalog, locale: 'en' as const, notes: [] }
    expect(text(run('notes', ctx({ catalog: en, t: getMessages('en').eggs })).lines)).toContain('Portuguese')
  })

  it('roll rola dados de verdade dentro do intervalo', () => {
    expect(text(run('roll', ctx({ random: () => 0.999 })).lines)).toContain('20')
    expect(text(run('roll 3d6', ctx({ random: () => 0 })).lines)).toContain('= 3')
    expect(text(run('rolar 2d10', ctx()).lines)).toContain('6 + 6 = 12')
    expect(text(run('roll 0d6', ctx()).lines)).toContain('uso')
    expect(text(run('roll banana', ctx()).lines)).toContain('uso')
  })

  it('roll d20 destaca o 20 e o 1 naturais', () => {
    expect(text(run('roll d20', ctx({ random: () => 0.999 })).lines)).toContain('20 natural')
    expect(text(run('roll d20', ctx({ random: () => 0 })).lines)).toContain('1 natural')
  })

  it('hero troca a cena', () => {
    expect(run('hero cometa', ctx()).effect).toEqual({ type: 'hero', scene: 'comet' })
    expect(run('hero rain', ctx()).effect).toEqual({ type: 'hero', scene: 'rain' })
    expect(run('hero', ctx()).effect).toBeUndefined()
  })

  it('neon e shortcuts pedem efeitos', () => {
    expect(run('neon', ctx()).effect).toEqual({ type: 'neon' })
    expect(text(run('neon', ctx({ neon: false })).lines)).toContain('ativado')
    expect(run('?', ctx()).effect).toEqual({ type: 'shortcuts' })
    expect(run('atalhos', ctx()).effect).toEqual({ type: 'shortcuts' })
  })

  it('rotas de máquina vêm do catálogo, sem fixar quantas são', () => {
    expect(links(run('machine', ctx()).lines)).toEqual(catalog.machine.map((item) => item.path))
    // Rotas de máquina não são páginas: o link pede recarga completa (o roteador do cliente trataria
    // `/escrita/x.md` como o artigo de slug "x.md" e mostraria a 404).
    const hrefs = run('machine', ctx()).lines.flat().filter((segment) => segment.href)
    expect(hrefs.length).toBeGreaterThan(0)
    expect(hrefs.every((segment) => segment.reload === true)).toBe(true)
    expect(run('ls artigos', ctx()).lines.flat().some((segment) => segment.href && segment.reload)).toBe(false)
    const extra = { ...catalog, machine: [...catalog.machine, { path: '/escrita/x.md', note: 'markdown' }] }
    expect(links(run('machine', ctx({ catalog: extra })).lines)).toHaveLength(7)
    expect(links(run('mcp', ctx()).lines)).toContain('/mcp')
    expect(links(run('llms', ctx()).lines)).toEqual(['/llms.txt', '/llms-full.txt'])
    expect(links(run('resume', ctx()).lines)).toEqual(['/resume.json'])
    expect(links(run('rss', ctx()).lines)).toEqual(['/rss/blog.xml'])
  })

  it('sudo e rm -rf respondem como os avisos', () => {
    const t = getMessages('pt-BR').eggs
    expect(text(run('sudo rm -rf /', ctx()).lines)).toBe(t.toast.sudo)
    expect(text(run('rm -rf /', ctx()).lines)).toBe(t.toast.rm)
  })

  it('snake aponta para o Sobre', () => {
    expect(links(run('snake', ctx()).lines)).toEqual(['/sobre/'])
  })

  it('exit e date respondem', () => {
    expect(run('exit', ctx()).lines.length).toBeGreaterThan(0)
    expect(text(run('date', ctx()).lines)).toContain('2026')
  })

  it('exit (e os apelidos) pede para fechar o aparelho', () => {
    for (const name of ['exit', 'sair', 'logout', 'quit']) expect(run(name, ctx()).effect).toEqual({ type: 'close' })
  })

  it('lontra mostra a arte', () => {
    expect(text(run('lontra', ctx()).lines)).toContain('lontra online')
  })

  it('comando desconhecido delega para unknownCommand', () => {
    const result = run('xyzzy', ctx())
    expect(result.lines.length).toBeGreaterThan(0)
    expect(result.effect).toBeUndefined()
  })
})

describe('unknownCommand', () => {
  it('devolve ao menos uma linha', () => {
    expect(unknownCommand('hlep', visibleCommands()).length).toBeGreaterThan(0)
  })
})

describe('complete', () => {
  it('completa o nome do comando', () => {
    expect(complete('his', catalog)).toEqual({ value: 'history ', options: [] })
  })

  it('com várias opções, avança até o prefixo comum e lista', () => {
    const result = complete('h', catalog)
    expect(result.value).toBe('h')
    expect(result.options).toEqual(expect.arrayContaining(['help', 'hero', 'history']))
  })

  it('completa argumentos de ls, cat, open e hero', () => {
    expect(complete('ls art', catalog).value).toBe('ls artigos ')
    expect(complete('cat so', catalog).value).toBe('cat sobre.txt ')
    expect(complete('open tux', catalog).value).toBe('open tuxedo ')
    expect(complete('hero co', catalog).value).toBe('hero cometa ')
  })

  it('sem nada a completar devolve a entrada', () => {
    expect(complete('xyz', catalog)).toEqual({ value: 'xyz', options: [] })
  })
})
