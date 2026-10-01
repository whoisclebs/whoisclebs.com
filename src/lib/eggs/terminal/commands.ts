/**
 * Interpretador do terminal da home. Puro e testado: recebe a linha digitada e um contexto (catálogo do site,
 * textos do idioma e o que o navegador mediu) e devolve as linhas de saída e, às vezes, um efeito para o
 * componente executar (navegar, limpar, trocar a cena do hero, neon, painel de atalhos).
 *
 * Toda saída vem do catálogo (`terminalCatalog` no servidor) ou do i18n: nada inventado sobre o autor.
 */
import type { BuildInfo } from '$lib/build-info'
import { format, formatDate, type Messages } from '$lib/i18n'
import { absoluteUrl } from '$lib/routing/paths'
import type { HeroScene } from '../state.svelte'
import type { TerminalCatalog } from './catalog'

export type Tone = 'muted' | 'accent' | 'error'
/** `reload`: o link não é uma página do site (arquivo, feed, rota de máquina) e pede recarga completa. */
export type Segment = { text: string; href?: string; tone?: Tone; reload?: true }
export type Line = Segment[]

export type Effect =
  | { type: 'navigate'; href: string }
  | { type: 'clear' }
  | { type: 'hero'; scene: HeroScene }
  | { type: 'neon' }
  | { type: 'shortcuts' }
  /** Fecha o aparelho que hospeda o terminal (a tampa do notebook). */
  | { type: 'close' }

export interface Result {
  lines: Line[]
  effect?: Effect
}

export interface TerminalContext {
  catalog: TerminalCatalog
  /** Namespace `eggs` do idioma do catálogo (avisos e textos do terminal). */
  t: Messages['eggs']
  /** Comandos desta sessão, do mais antigo ao mais novo (só em memória). */
  history: readonly string[]
  /** Medido no navegador: ms desde que a página abriu. */
  elapsedMs: number
  now: Date
  build: BuildInfo | null
  /** Estado atual do modo neon, para dizer se o comando liga ou desliga. */
  neon: boolean
  /** Fonte de aleatoriedade dos dados (`Math.random` no navegador; fixa nos testes). */
  random: () => number
}

type Handler = (args: string, ctx: TerminalContext) => Result
type HelpKey = keyof Messages['eggs']['terminal']['commands']

interface Command {
  name: string
  aliases: readonly string[]
  /** Comandos escondidos não aparecem no help nem no Tab: são o easter egg dentro do easter egg. */
  help?: HelpKey
  run: Handler
}

// ---------- Ajudantes de saída ----------

const plain = (text: string, tone?: Tone): Line => [tone ? { text, tone } : { text }]
const say = (...lines: Line[]): Result => ({ lines })
const error = (text: string): Result => say(plain(text, 'error'))

/** Tira acentos e barras e passa para minúsculas: "Páginas/" → "paginas". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
}

function duration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours) return `${hours}h ${minutes}min ${seconds}s`
  if (minutes) return `${minutes}min ${seconds}s`
  return `${seconds}s`
}

/** Lista com link: `título` (link) e um complemento apagado. */
function linked(text: string, href: string, extra?: string): Line {
  const line: Line = [{ text, href }]
  if (extra) line.push({ text: `  ${extra}`, tone: 'muted' })
  return line
}

function orEmpty(lines: Line[], ctx: TerminalContext): Line[] {
  return lines.length ? lines : [plain(ctx.t.terminal.empty, 'muted')]
}

// ---------- Diretórios e arquivos ----------

type Dir = 'articles' | 'notes' | 'projects' | 'pages'
type File = 'about' | 'now' | 'contact'

const DIR_NAMES: Record<Dir, { 'pt-BR': string; en: string }> = {
  articles: { 'pt-BR': 'artigos', en: 'articles' },
  notes: { 'pt-BR': 'notas', en: 'notes' },
  projects: { 'pt-BR': 'projetos', en: 'projects' },
  pages: { 'pt-BR': 'paginas', en: 'pages' },
}

const FILE_NAMES: Record<File, { 'pt-BR': string; en: string }> = {
  about: { 'pt-BR': 'sobre.txt', en: 'about.txt' },
  now: { 'pt-BR': 'agora.txt', en: 'now.txt' },
  contact: { 'pt-BR': 'contato.txt', en: 'contact.txt' },
}

/** Nomes que existem no idioma do catálogo (o outro idioma também é aceito, mas não é sugerido). */
function dirNames(ctx: Pick<TerminalContext, 'catalog'>): string[] {
  return Object.values(DIR_NAMES).map((names) => names[ctx.catalog.locale])
}

function fileNames(ctx: Pick<TerminalContext, 'catalog'>): string[] {
  return Object.values(FILE_NAMES).map((names) => names[ctx.catalog.locale])
}

function findKey<K extends string>(table: Record<K, { 'pt-BR': string; en: string }>, value: string): K | undefined {
  const wanted = normalize(value)
  return (Object.keys(table) as K[]).find((key) => table[key]['pt-BR'] === wanted || table[key].en === wanted)
}

function listDir(dir: Dir, ctx: TerminalContext): Line[] {
  const { catalog, t } = ctx
  switch (dir) {
    case 'articles':
      return orEmpty(
        catalog.articles.map((item) => linked(item.title, item.href, `${formatDate(item.date, catalog.locale)} · ${item.topic}`)),
        ctx,
      )
    case 'notes':
      if (catalog.locale === 'en' && !catalog.notes.length) return [plain(t.terminal.notesOnlyPt, 'muted')]
      return orEmpty(
        catalog.notes.map((item) => linked(item.title, item.href, formatDate(item.date, catalog.locale))),
        ctx,
      )
    case 'projects':
      return orEmpty(
        catalog.projects.map((item) => linked(item.name, item.href, [item.language, item.status].filter(Boolean).join(' · '))),
        ctx,
      )
    case 'pages':
      return orEmpty(
        catalog.pages.map((item) => linked(item.label, item.href, item.href)),
        ctx,
      )
  }
}

function readFile(file: File, ctx: TerminalContext): Line[] {
  const { catalog, t } = ctx
  switch (file) {
    case 'about':
      return catalog.about.map((paragraph) => plain(paragraph))
    case 'now':
      return [
        ...catalog.now.items.map((item): Line => [{ text: `${item.label}: `, tone: 'accent' }, { text: item.text }]),
        plain(format(t.terminal.nowUpdated, { date: formatDate(catalog.now.updatedAt, catalog.locale) }), 'muted'),
      ]
    case 'contact':
      return [
        linked(catalog.email, `mailto:${catalog.email}`),
        ...catalog.social.map((item) => linked(item.label, item.href)),
      ]
  }
}

// ---------- Navegação ----------

/** Acha o destino de `open`/`cd`: página (chave, rótulo ou caminho), artigo, projeto ou nota pelo slug. */
export function resolveTarget(arg: string, catalog: TerminalCatalog): string | null {
  const wanted = normalize(arg)
  const home = catalog.pages.find((page) => page.key === 'home')?.href ?? '/'
  if (['', '~', '..', '.', 'home', 'inicio'].includes(wanted)) return home
  const lastSegment = (href: string) => normalize(href).split('/').pop() ?? ''
  const page = catalog.pages.find(
    (item) => item.key === wanted || normalize(item.label) === wanted || normalize(item.href) === wanted || lastSegment(item.href) === wanted,
  )
  if (page) return page.href
  const dir = findKey(DIR_NAMES, wanted)
  const dirPage = dir && catalog.pages.find((item) => item.key === (dir === 'articles' ? 'writing' : dir))
  if (dirPage) return dirPage.href
  const content = [...catalog.articles, ...catalog.projects, ...catalog.notes].find((item) => item.slug === wanted)
  return content?.href ?? null
}

function openTarget(args: string, ctx: TerminalContext, allowEmpty: boolean): Result {
  if (!args && !allowEmpty) return say(plain(ctx.t.terminal.usage.open, 'muted'))
  const href = resolveTarget(args, ctx.catalog)
  if (!href) return error(format(ctx.t.terminal.noPage, { name: args }))
  return { lines: [plain(format(ctx.t.terminal.opening, { href }), 'muted')], effect: { type: 'navigate', href } }
}

// ---------- Rotas de máquina ----------

function machineLines(ctx: TerminalContext, match: (path: string) => boolean): Line[] {
  return orEmpty(
    // Recarga completa: o roteador do cliente leria `/escrita/<slug>.md` como a página do artigo "<slug>.md" (404).
    ctx.catalog.machine
      .filter((item) => match(item.path))
      .map((item) => linked(item.path, item.path, item.note).map((segment) => (segment.href ? { ...segment, reload: true as const } : segment))),
    ctx,
  )
}

// ---------- Dados ----------

const DICE = /^(\d*)d(\d+)$/

function roll(args: string, ctx: TerminalContext): Result {
  const spec = normalize(args || 'd20')
  const match = DICE.exec(spec)
  const count = match ? Number(match[1] || 1) : 0
  const sides = match ? Number(match[2]) : 0
  if (!match || count < 1 || count > 20 || sides < 2 || sides > 1000) return say(plain(ctx.t.terminal.usage.roll, 'muted'))
  const rolls = Array.from({ length: count }, () => Math.min(sides, Math.floor(ctx.random() * sides) + 1))
  const total = rolls.reduce((sum, value) => sum + value, 0)
  const label = `${count === 1 ? '' : count}d${sides}`
  const lines: Line[] = [[{ text: `${label}: `, tone: 'muted' }, { text: count === 1 ? String(total) : `${rolls.join(' + ')} = ${total}`, tone: 'accent' }]]
  if (count === 1 && sides === 20 && (total === 20 || total === 1)) lines.push(plain(format(ctx.t.terminal.natural, { n: total })))
  return { lines }
}

// ---------- Lontra (do brainstorm antigo: uma lontra num PC de tubo) ----------

const OTTER = [
  '   .-"""-.      .--------.',
  "  /  o o  \\     | ~~  ~~ |",
  ' |   (_)   |    | ~~~~~  |',
  "  \\  '-'  /     '--------'",
  "   '-...-'       _|____|_",
]

// ---------- Tabela de comandos ----------

const COMMANDS: readonly Command[] = [
  {
    name: 'help',
    aliases: ['ajuda', 'man'],
    help: 'help',
    run: (_args, ctx) => {
      const visible = COMMANDS.filter((command) => command.help)
      const width = Math.max(...visible.map((command) => command.name.length)) + 2
      return say(
        plain(ctx.t.terminal.help, 'muted'),
        ...visible.map((command): Line => [
          { text: command.name.padEnd(width), tone: 'accent' },
          { text: command.help ? ctx.t.terminal.commands[command.help] : '' },
        ]),
      )
    },
  },
  { name: 'clear', aliases: ['limpar', 'cls'], help: 'clear', run: () => ({ lines: [], effect: { type: 'clear' } }) },
  {
    name: 'history',
    aliases: ['historico'],
    help: 'history',
    run: (_args, ctx) => say(...ctx.history.map((entry, index) => plain(`${String(index + 1).padStart(3)}  ${entry}`))),
  },
  { name: 'echo', aliases: [], help: 'echo', run: (args) => say(plain(args)) },
  {
    name: 'date',
    aliases: ['data'],
    help: 'date',
    run: (_args, ctx) => say(plain(new Intl.DateTimeFormat(ctx.catalog.locale, { dateStyle: 'full', timeStyle: 'medium' }).format(ctx.now))),
  },
  {
    name: 'whoami',
    aliases: ['quemsou'],
    help: 'whoami',
    run: (_args, ctx) => say(plain(ctx.t.terminal.whoami, 'muted'), ...ctx.catalog.about.slice(0, 1).map((text) => plain(text))),
  },
  {
    name: 'uptime',
    aliases: [],
    help: 'uptime',
    run: (_args, ctx) => say(plain(format(ctx.t.terminal.uptime, { time: duration(ctx.elapsedMs) }))),
  },
  {
    name: 'build',
    aliases: ['versao', 'version'],
    help: 'build',
    run: (_args, ctx) =>
      ctx.build
        ? say([{ text: `${ctx.t.terminal.build} `, tone: 'muted' }, { text: ctx.build.short, href: ctx.build.url }])
        : say([{ text: `${ctx.t.terminal.build} `, tone: 'muted' }, { text: ctx.t.terminal.noData }]),
  },
  {
    name: 'ls',
    aliases: ['dir'],
    help: 'ls',
    run: (args, ctx) => {
      if (!args) {
        return say([
          ...dirNames(ctx).map((name): Segment => ({ text: `${name}/  `, tone: 'accent' })),
          ...fileNames(ctx).map((name): Segment => ({ text: `${name}  ` })),
        ])
      }
      const dir = findKey(DIR_NAMES, args)
      if (!dir) return error(format(ctx.t.terminal.noDir, { name: args, dirs: dirNames(ctx).join(', ') }))
      return say(...listDir(dir, ctx))
    },
  },
  {
    name: 'cat',
    aliases: ['less', 'more'],
    help: 'cat',
    run: (args, ctx) => {
      if (!args) return say(plain(format(ctx.t.terminal.usage.cat, { files: fileNames(ctx).join(', ') }), 'muted'))
      const file = findKey(FILE_NAMES, args)
      if (!file) return error(format(ctx.t.terminal.noFile, { name: args }))
      return say(...readFile(file, ctx))
    },
  },
  { name: 'open', aliases: ['abrir'], help: 'open', run: (args, ctx) => openTarget(args, ctx, false) },
  { name: 'cd', aliases: [], run: (args, ctx) => openTarget(args, ctx, true) },
  { name: 'articles', aliases: ['artigos', 'posts'], help: 'articles', run: (_args, ctx) => say(...listDir('articles', ctx)) },
  { name: 'notes', aliases: ['notas'], help: 'notes', run: (_args, ctx) => say(...listDir('notes', ctx)) },
  { name: 'projects', aliases: ['projetos'], help: 'projects', run: (_args, ctx) => say(...listDir('projects', ctx)) },
  { name: 'now', aliases: ['agora'], help: 'now', run: (_args, ctx) => say(...readFile('now', ctx)) },
  { name: 'contact', aliases: ['contato', 'social', 'redes'], help: 'contact', run: (_args, ctx) => say(...readFile('contact', ctx)) },
  {
    name: 'games',
    aliases: ['jogos'],
    help: 'games',
    run: (_args, ctx) =>
      say(plain(ctx.t.terminal.games, 'muted'), ...orEmpty(ctx.catalog.boardGames.map((game): Line => [{ text: game.title }, { text: `  ${game.players}`, tone: 'muted' }]), ctx)),
  },
  {
    name: 'books',
    aliases: ['livros'],
    help: 'books',
    run: (_args, ctx) =>
      say(plain(ctx.t.terminal.books, 'muted'), ...orEmpty(ctx.catalog.books.map((book): Line => [{ text: book.title }, { text: `  ${book.author}`, tone: 'muted' }]), ctx)),
  },
  { name: 'roll', aliases: ['rolar', 'dados'], help: 'roll', run: roll },
  {
    name: 'hero',
    aliases: ['cena'],
    help: 'hero',
    run: (args, ctx) => {
      const wanted = normalize(args)
      const scene: HeroScene | null = ['chuva', 'rain'].includes(wanted) ? 'rain' : ['cometa', 'comet'].includes(wanted) ? 'comet' : null
      if (!scene) return say(plain(ctx.t.terminal.usage.hero, 'muted'))
      return { lines: [plain(scene === 'comet' ? ctx.t.toast.comet : ctx.t.toast.rain)], effect: { type: 'hero', scene } }
    },
  },
  {
    name: 'neon',
    aliases: [],
    help: 'neon',
    run: (_args, ctx) => ({ lines: [plain(ctx.neon ? ctx.t.toast.neonOff : ctx.t.toast.neonOn)], effect: { type: 'neon' } }),
  },
  {
    name: 'shortcuts',
    aliases: ['?', 'atalhos'],
    help: 'shortcuts',
    run: (_args, ctx) => ({ lines: [plain(ctx.t.terminal.shortcuts, 'muted')], effect: { type: 'shortcuts' } }),
  },
  {
    name: 'machine',
    aliases: ['maquina', 'machines'],
    help: 'machine',
    run: (_args, ctx) => say(plain(ctx.t.terminal.machine, 'muted'), ...machineLines(ctx, () => true)),
  },
  {
    name: 'mcp',
    aliases: [],
    help: 'mcp',
    run: (_args, ctx) => {
      const lines = machineLines(ctx, (path) => path.includes('mcp'))
      const endpoint = ctx.catalog.machine.find((item) => item.path.includes('mcp'))
      if (endpoint) lines.push(plain(format(ctx.t.terminal.mcpHint, { url: absoluteUrl(endpoint.path) }), 'muted'))
      return say(...lines)
    },
  },
  { name: 'llms', aliases: ['llm', 'llms.txt'], help: 'llms', run: (_args, ctx) => say(...machineLines(ctx, (path) => path.startsWith('/llms'))) },
  { name: 'resume', aliases: ['curriculo', 'cv'], help: 'resume', run: (_args, ctx) => say(...machineLines(ctx, (path) => path.includes('resume'))) },
  { name: 'rss', aliases: ['feed'], help: 'rss', run: (_args, ctx) => say(...machineLines(ctx, (path) => path.includes('/rss/'))) },
  {
    name: 'exit',
    aliases: ['sair', 'logout', 'quit'],
    help: 'exit',
    run: (_args, ctx) => ({ lines: [plain(ctx.t.terminal.exit, 'muted')], effect: { type: 'close' } }),
  },
  // Escondidos.
  { name: 'sudo', aliases: [], run: (_args, ctx) => say(plain(ctx.t.toast.sudo)) },
  { name: 'rm', aliases: [], run: (_args, ctx) => say(plain(ctx.t.toast.rm)) },
  {
    name: 'snake',
    aliases: ['serpente', 'cobrinha'],
    run: (_args, ctx) => {
      const about = ctx.catalog.pages.find((page) => page.key === 'about')
      return say(about ? [{ text: `${ctx.t.terminal.snake} ` }, { text: about.href, href: about.href }] : plain(ctx.t.terminal.snake))
    },
  },
  {
    name: 'lontra',
    aliases: ['otter'],
    run: (_args, ctx) => say(...OTTER.map((row) => plain(row, 'accent')), plain(ctx.t.terminal.otter)),
  },
]

/** Nomes que aparecem no `help` e no Tab. */
export function visibleCommands(): string[] {
  return COMMANDS.filter((command) => command.help || command.name === 'cd').map((command) => command.name)
}

function findCommand(name: string): Command | undefined {
  const wanted = name.toLowerCase()
  return COMMANDS.find((command) => command.name === wanted || command.aliases.includes(wanted))
}

/**
 * Resposta para um comando que não existe.
 *
 * TODO(human): o dono do site decide o comportamento aqui. Opções: sugerir o comando mais próximo (distância
 * de edição contra `known`, ex.: "hlep" → "help"), responder com uma piada curta, ou as duas coisas. Os
 * testes só exigem que a função devolva ao menos uma linha. `notFound` chega já traduzido
 * (`eggs.terminal.notFound`); a primeira linha sai em destaque de erro, as demais em texto normal.
 */
export function unknownCommand(input: string, known: readonly string[], notFound = `${input}: command not found`): string[] {
  void known
  return [notFound]
}

export function run(input: string, ctx: TerminalContext): Result {
  const trimmed = input.trim()
  if (!trimmed) return { lines: [] }
  const name = trimmed.split(/\s+/, 1)[0] ?? ''
  // `echo` preserva os espaços do texto; os outros comandos recebem o argumento já aparado.
  const args = trimmed.slice(name.length).trim()
  const command = findCommand(name)
  if (command) return command.run(args, ctx)
  const [first = '', ...others] = unknownCommand(name, visibleCommands(), format(ctx.t.terminal.notFound, { cmd: name }))
  return say(plain(first, 'error'), ...others.map((line) => plain(line)))
}

// ---------- Tab ----------

function argumentOptions(command: string, catalog: TerminalCatalog): string[] {
  const ctx = { catalog }
  switch (command) {
    case 'ls':
      return dirNames(ctx)
    case 'cat':
      return fileNames(ctx)
    case 'open':
    case 'cd':
      return [
        ...catalog.pages.map((page) => normalize(page.label)),
        ...catalog.articles.map((item) => item.slug),
        ...catalog.projects.map((item) => item.slug),
        ...catalog.notes.map((item) => item.slug),
      ]
    case 'hero':
      return catalog.locale === 'en' ? ['rain', 'comet'] : ['chuva', 'cometa']
    case 'roll':
      return ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']
    default:
      return []
  }
}

function commonPrefix(values: readonly string[]): string {
  if (!values.length) return ''
  return values.reduce((prefix, value) => {
    let index = 0
    while (index < prefix.length && prefix[index] === value[index]) index++
    return prefix.slice(0, index)
  })
}

/**
 * Completa o comando (ou o argumento de `ls`, `cat`, `open`, `cd`, `hero`, `roll`). Com uma opção, completa
 * e põe o espaço; com várias, avança até o prefixo comum e devolve as opções para listar.
 */
export function complete(input: string, catalog: TerminalCatalog): { value: string; options: string[] } {
  const space = input.indexOf(' ')
  const head = space === -1 ? '' : input.slice(0, space + 1)
  const partial = space === -1 ? input : input.slice(space + 1)
  if (partial.includes(' ')) return { value: input, options: [] }
  const commandName = findCommand(head.trim())?.name ?? head.trim().toLowerCase()
  const pool = space === -1 ? visibleCommands() : argumentOptions(commandName, catalog)
  const wanted = partial.toLowerCase()
  const options = [...new Set(pool)].filter((option) => option.startsWith(wanted))
  if (options.length === 1) return { value: `${head}${options[0]} `, options: [] }
  if (options.length > 1) {
    const prefix = commonPrefix(options)
    return { value: `${head}${prefix.length > partial.length ? prefix : partial}`, options }
  }
  return { value: input, options: [] }
}
