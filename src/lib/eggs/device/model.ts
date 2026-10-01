/**
 * Lógica dos aparelhos da home (notebook e celular), sem DOM: a máquina de estados da abertura, as linhas de
 * boot e a lista de apps da gaveta. Tudo vem do catálogo real do site (`TerminalCatalog`) e do commit do
 * build; nada de dado inventado.
 */
import type { BuildInfo } from '$lib/build-info'
import type { TerminalCatalog } from '../terminal/catalog'

// ---------- Máquina de estados ----------

/**
 * fechado → abrindo → boot → ligado → fechando → fechado. No celular "abrindo" é a tela acendendo.
 * `booted` lembra se o boot já tocou nesta visita: ao reabrir, vai direto para ligado.
 */
export type Phase = 'closed' | 'opening' | 'boot' | 'on' | 'closing'

/**
 * `toggle`: o gesto no aparelho (abre ou fecha, inclusive no meio do movimento);
 * `close`: Esc, botão de energia ou `exit`; `settled`: o movimento de abrir ou fechar terminou;
 * `booted`: o boot terminou (vídeo acabou, falhou ou passou do tempo).
 */
export type DeviceEvent = 'toggle' | 'close' | 'settled' | 'booted'

export interface Machine {
  phase: Phase
  booted: boolean
}

/** `quiet`: movimento reduzido ou economia de dados. Sem vídeo e sem linhas: vai direto para ligado. */
export function step(machine: Machine, event: DeviceEvent, options: { quiet?: boolean } = {}): Machine {
  const { phase, booted } = machine
  switch (event) {
    case 'toggle':
      if (phase === 'closed' || phase === 'closing') return { phase: 'opening', booted }
      return { phase: 'closing', booted }
    case 'close':
      return isOpen(phase) ? { phase: 'closing', booted } : machine
    case 'settled':
      if (phase === 'closing') return { phase: 'closed', booted }
      if (phase !== 'opening') return machine
      if (booted || options.quiet) return { phase: 'on', booted: true }
      return { phase: 'boot', booted }
    case 'booted':
      return phase === 'boot' ? { phase: 'on', booted: true } : machine
  }
}

/** A tampa está aberta ou abrindo (é o que `aria-expanded` anuncia). */
export function isOpen(phase: Phase): boolean {
  return phase === 'opening' || phase === 'boot' || phase === 'on'
}

// ---------- Boot ----------

export interface BootLine {
  label: string
  value: string
}

export interface BootLabels {
  articles: string
  notes: string
  projects: string
  pages: string
  build: string
  noData: string
}

/**
 * Linhas que aparecem por cima do vídeo de boot: quantos itens o catálogo carregou e o commit publicado.
 * Notas só existem em português; sem notas, a linha some. `compact` (celular): artigos, projetos e build.
 */
export function bootLines(catalog: TerminalCatalog, build: BuildInfo | null, labels: BootLabels, options: { compact?: boolean } = {}): BootLine[] {
  const count = (items: readonly unknown[]) => String(items.length)
  const commit = { label: labels.build, value: build?.short ?? labels.noData }
  if (options.compact) {
    return [{ label: labels.articles, value: count(catalog.articles) }, { label: labels.projects, value: count(catalog.projects) }, commit]
  }
  return [
    { label: labels.articles, value: count(catalog.articles) },
    ...(catalog.notes.length ? [{ label: labels.notes, value: count(catalog.notes) }] : []),
    { label: labels.projects, value: count(catalog.projects) },
    { label: labels.pages, value: count(catalog.pages) },
    commit,
  ]
}

// ---------- Gaveta de aplicativos ----------

/** Glifos desenhados em `AppIcon.svelte`. */
export type Glyph =
  | 'writing'
  | 'projects'
  | 'about'
  | 'notes'
  | 'books'
  | 'hobbies'
  | 'contact'
  | 'rss'
  | 'github'
  | 'linkedin'
  | 'video'
  | 'letter'
  | 'link'
  | 'snake'
  | 'dice'
  | 'neon'
  | 'scene'

/** Fundo do ícone, sempre na paleta do site. */
export type Tint = 'ink' | 'cyan' | 'cream' | 'pink' | 'green'

type AppBase = { id: string; label: string; glyph: Glyph; tint: Tint }

/**
 * `link`: página do site (navegação do SvelteKit); `feed`: arquivo do site que não é página (recarga
 * normal); `external`: perfil em outro site; `action`: muda algo nesta página.
 */
export type App =
  | (AppBase & { kind: 'link' | 'feed' | 'external'; href: string })
  | (AppBase & { kind: 'action'; action: 'neon' | 'scene' })

export interface AppLabels {
  rss: string
  snake: string
  dice: string
  neon: string
  scene: string
}

const PAGE_APPS: { key: string; glyph: Glyph; tint: Tint }[] = [
  { key: 'writing', glyph: 'writing', tint: 'cyan' },
  { key: 'projects', glyph: 'projects', tint: 'ink' },
  { key: 'about', glyph: 'about', tint: 'cream' },
  { key: 'notes', glyph: 'notes', tint: 'ink' },
  { key: 'books', glyph: 'books', tint: 'cream' },
  { key: 'hobbies', glyph: 'hobbies', tint: 'green' },
  { key: 'contact', glyph: 'contact', tint: 'ink' },
]

function socialGlyph(label: string): Glyph {
  const name = label.toLowerCase()
  if (name.includes('github')) return 'github'
  if (name.includes('linkedin')) return 'linkedin'
  if (name.includes('youtube')) return 'video'
  if (name.includes('substack')) return 'letter'
  return 'link'
}

/** Apps da gaveta: páginas do idioma, RSS, perfis e os brinquedos do site. */
export function drawerApps(catalog: TerminalCatalog, labels: AppLabels): App[] {
  const page = (key: string) => catalog.pages.find((item) => item.key === key)
  const apps: App[] = []
  for (const spec of PAGE_APPS) {
    const found = page(spec.key)
    if (found) apps.push({ id: `page-${spec.key}`, label: found.label, glyph: spec.glyph, tint: spec.tint, kind: 'link', href: found.href })
  }
  const feed = catalog.machine.find((item) => item.path.includes('/rss/'))
  if (feed) apps.push({ id: 'rss', label: labels.rss, glyph: 'rss', tint: 'ink', kind: 'feed', href: feed.path })
  catalog.social.forEach((link, index) => {
    apps.push({ id: `social-${index}`, label: link.label, glyph: socialGlyph(link.label), tint: 'ink', kind: 'external', href: link.href })
  })
  const about = page('about')
  if (about) apps.push({ id: 'snake', label: labels.snake, glyph: 'snake', tint: 'green', kind: 'link', href: about.href })
  const hobbies = page('hobbies')
  if (hobbies) apps.push({ id: 'dice', label: labels.dice, glyph: 'dice', tint: 'cream', kind: 'link', href: hobbies.href })
  apps.push({ id: 'neon', label: labels.neon, glyph: 'neon', tint: 'pink', kind: 'action', action: 'neon' })
  apps.push({ id: 'scene', label: labels.scene, glyph: 'scene', tint: 'cyan', kind: 'action', action: 'scene' })
  return apps
}
