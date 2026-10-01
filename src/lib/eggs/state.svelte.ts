/**
 * Estado compartilhado dos easter eggs. Fica num módulo pequeno, importado estaticamente por quem só precisa
 * ler ou disparar (home, rodapé, Sobre); a escuta de teclado, o painel de atalhos e o terminal são ilhas
 * carregadas por import dinâmico (`EasterEggs.svelte`, `terminal/`), fora do JS de entrada.
 *
 * Tudo aqui exige um gesto do visitante. Nada é telemetria: o que parece dado (ex.: `uptime`) é medido no
 * próprio navegador.
 */
export type HeroScene = 'rain' | 'comet'

const HERO_KEY = 'whoisclebs.hero'
const TOAST_MS = 3600

export const eggs = $state({
  /** Modo neon (código Konami): linhas de varredura e brilho nas bordas. */
  neon: false,
  /** Painel de atalhos (`?`). */
  help: false,
  /** Título alternativo do hero por 5 s (digitar "clebs"). */
  altHeadline: false,
  /** Cena do hero da home: a chuva (padrão) ou o cometa do desenho anterior. */
  heroScene: 'rain' as HeroScene,
  /** Um jogo ou campo de texto está com o teclado: a escuta global dos easter eggs fica parada. */
  keysCaptured: false,
  /** Aviso curto no pé da tela; `key` muda a cada aviso para reiniciar a animação. */
  toast: null as { text: string; key: number } | null,
})

let toastTimer: ReturnType<typeof setTimeout> | undefined

/** Mostra um aviso por 3,6 s (substitui o anterior). */
export function say(text: string): void {
  eggs.toast = { text, key: Date.now() }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    eggs.toast = null
  }, TOAST_MS)
}

/** Lê a cena salva. O armazenamento pode falhar (janela privada, bloqueio): aí vale o padrão. */
export function loadHeroScene(): HeroScene {
  try {
    return localStorage.getItem(HERO_KEY) === 'comet' ? 'comet' : 'rain'
  } catch {
    return 'rain'
  }
}

/** Troca a cena do hero e guarda a escolha só neste navegador. */
export function setHeroScene(scene: HeroScene): void {
  eggs.heroScene = scene
  try {
    if (scene === 'rain') localStorage.removeItem(HERO_KEY)
    else localStorage.setItem(HERO_KEY, scene)
  } catch {
    // Sem armazenamento a troca vale só até recarregar.
  }
}
