import type { Locale } from '$lib/i18n'

/**
 * Tudo o que o terminal sabe listar. Vem pronto do servidor (`terminalCatalog` em `$lib/server/pages`), já no
 * idioma da página, para a ilha do terminal não importar conteúdo: só dados reais do site, nada inventado.
 */
export type TerminalCatalog = {
  locale: Locale
  /** Caminho de cada página que existe neste idioma (`open`, `cd`). */
  pages: { key: string; label: string; href: string }[]
  articles: { slug: string; title: string; href: string; date: string; topic: string }[]
  /** Notas só existem em pt-BR: no inglês a lista vem vazia. */
  notes: { slug: string; title: string; href: string; date: string }[]
  projects: { slug: string; name: string; description: string; status: string; language: string; href: string; repo: string; lastCommit: string }[]
  boardGames: { title: string; players: string }[]
  books: { title: string; author: string }[]
  social: { label: string; href: string }[]
  email: string
  /** Parágrafos de apresentação do Sobre (`whoami`, `cat sobre.txt`), no idioma da página. */
  about: string[]
  /** Bloco "Agora" do Sobre: rótulo e texto de cada linha, e a data da última revisão. */
  now: { items: { label: string; text: string }[]; updatedAt: string }
  /** Rotas para máquinas, publicadas de verdade pelo site. */
  machine: { path: string; note: string }[]
}
