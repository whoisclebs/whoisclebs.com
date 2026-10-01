/**
 * Mapa único de URLs legadas (site React, inventário de URLs) → rotas novas.
 * Aplicado em `src/hooks.server.ts` com 301.
 */
type Rule = { from: RegExp; to: (slug?: string) => string }

const slug = '([a-z0-9]+(?:-[a-z0-9]+)*)'
const rules: Rule[] = [
  { from: /^\/about\/?$/, to: () => '/sobre/' },
  { from: /^\/books\/?$/, to: () => '/livros/' },
  { from: /^\/portfolio\/?$/, to: () => '/projetos/' },
  { from: /^\/projects\/?$/, to: () => '/projetos/' },
  { from: new RegExp(`^/projects/${slug}/?$`), to: (s) => `/projetos/${s}/` },
  { from: /^\/blog\/?$/, to: () => '/escrita/' },
  { from: new RegExp(`^/blog/${slug}/?$`), to: (s) => `/escrita/${s}/` },
  { from: /^\/til\/?$/, to: () => '/notas/' },
  { from: new RegExp(`^/til/${slug}/?$`), to: (s) => `/notas/${s}/` },
  { from: /^\/en\/blog\/?$/, to: () => '/en/writing/' },
  { from: new RegExp(`^/en/blog/${slug}/?$`), to: (s) => `/en/writing/${s}/` },
  { from: /^\/en\/portfolio\/?$/, to: () => '/en/projects/' },
]

export const LEGACY_REDIRECT_STATUS = 301

export function resolveLegacyRedirect(pathname: string): string | null {
  for (const rule of rules) {
    const match = rule.from.exec(pathname)
    if (match) return rule.to(match[1])
  }
  return null
}
