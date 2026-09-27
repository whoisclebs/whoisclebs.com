import { describe, expect, it } from 'vitest'
import {
  estimateReadingMinutes,
  groupByYear,
  legacyCommentTerm,
  projectsForEntry,
  readingMinutes,
  shouldShowToc,
  topicFromKicker,
  writingForProject,
} from './editorial'

describe('assuntos', () => {
  it.each([
    ['DEVOPS', 'devops', 'DevOps'],
    ['OPEN SOURCE', 'open-source', 'Open source'],
    ['SEO', 'seo', 'SEO'],
    ['HACKATHON', 'hackathon', 'Hackathon'],
    ['PERFORMANCE', 'performance', 'Performance'],
  ])('%s vira slug %s e rótulo em caixa de frase %s', (kicker, slug, label) => {
    expect(topicFromKicker(kicker)).toEqual({ slug, label })
  })

  it('assunto sem rótulo conhecido cai em caixa de frase, sem caixa-alta', () => {
    expect(topicFromKicker('ARQUITETURA DE SISTEMAS')).toEqual({ slug: 'arquitetura-de-sistemas', label: 'Arquitetura de sistemas' })
  })
})

describe('tempo de leitura', () => {
  it('lê o número do front matter em pt-BR e en', () => {
    expect(readingMinutes('6 MIN DE LEITURA')).toBe(6)
    expect(readingMinutes('20 MIN READ')).toBe(20)
  })

  it('rejeita texto sem número', () => {
    expect(() => readingMinutes('rápido')).toThrow()
  })

  it('estima notas a 200 palavras por minuto, no mínimo 1', () => {
    expect(estimateReadingMinutes('uma nota curta')).toBe(1)
    expect(estimateReadingMinutes(Array.from({ length: 401 }, () => 'palavra').join(' '))).toBe(3)
  })

  it('não conta cercas de código como palavras', () => {
    const code = '```yaml\n' + Array.from({ length: 1000 }, () => 'x').join(' ') + '\n```'
    expect(estimateReadingMinutes(`texto ${code}`)).toBe(1)
  })
})

describe('agrupamento por ano', () => {
  it('mantém a ordem recebida e agrupa por ano de publicação', () => {
    const groups = groupByYear([
      { slug: 'c', date: '2025-09-16' },
      { slug: 'b', date: '2022-10-28' },
      { slug: 'a', date: '2022-08-06' },
    ])
    expect(groups.map((group) => [group.year, group.items.map((item) => item.slug)])).toEqual([
      ['2025', ['c']],
      ['2022', ['b', 'a']],
    ])
  })
})

describe('sumário', () => {
  it('só aparece com quatro seções ou mais', () => {
    const item = { id: 'a', text: 'A' }
    expect(shouldShowToc([item, item, item])).toBe(false)
    expect(shouldShowToc([item, item, item, item])).toBe(true)
  })
})

describe('termo do Giscus', () => {
  // O site antigo usava data-mapping="pathname": o termo é o pathname sem a barra inicial.
  it('usa o caminho antigo do blog, do blog em inglês e do TIL', () => {
    expect(legacyCommentTerm({ kind: 'article', slug: 'github-actions-como-fazer-deploy', locale: 'pt-BR' })).toBe('blog/github-actions-como-fazer-deploy/')
    expect(legacyCommentTerm({ kind: 'article', slug: 'github-actions-como-fazer-deploy', locale: 'en' })).toBe('en/blog/github-actions-como-fazer-deploy/')
    expect(legacyCommentTerm({ kind: 'note', slug: 'docker-healthcheck-para-servicos', locale: 'pt-BR' })).toBe('til/docker-healthcheck-para-servicos/')
  })
})

describe('relação escrita ↔ projeto', () => {
  const entries = [
    { slug: 'a', title: 'A', path: '/escrita/a/', date: '2025-01-01', projects: ['tuxedo'] },
    { slug: 'b', title: 'B', path: '/escrita/b/', date: '2026-01-01', projects: ['tuxedo', 'golpher'] },
    { slug: 'c', title: 'C', path: '/escrita/c/', date: '2024-01-01', projects: [] },
  ]

  it('o artigo lista os projetos declarados', () => {
    expect(projectsForEntry(entries[1]!).map((project) => project.slug)).toEqual(['tuxedo', 'golpher'])
  })

  it('o projeto lista de volta a escrita que o declara, mais recente primeiro', () => {
    expect(writingForProject('tuxedo', entries).map((entry) => entry.slug)).toEqual(['b', 'a'])
    expect(writingForProject('golpher', entries).map((entry) => entry.slug)).toEqual(['b'])
    expect(writingForProject('rsgit', entries)).toEqual([])
  })

  it('a relação é simétrica para todo par declarado', () => {
    for (const entry of entries) {
      for (const project of projectsForEntry(entry)) {
        expect(writingForProject(project.slug, entries)).toContainEqual(entry)
      }
    }
  })

  it('rejeita projeto inexistente', () => {
    expect(() => projectsForEntry({ ...entries[0]!, projects: ['nao-existe'] })).toThrow(/nao-existe/)
  })
})
