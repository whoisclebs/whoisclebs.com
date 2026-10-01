<!--
  Laptop clicável do hero (cena da chuva, easter egg do design). Vai no palco do HeroScene, que tem a geometria
  do quadro de vídeo.

  No vídeo o laptop está de lado na mesa: a tela aparece em perspectiva (as bordas opostas não são paralelas).
  Um retângulo reto recortado no formato dela deixava o texto torto em relação ao aparelho. Aqui o conteúdo é um
  plano de 480×300 deitado sobre a tela por uma homografia (`quad.ts`) que leva seus quatro cantos aos quatro
  cantos da área visível da tela, medidos no pôster de 1280×720. Botão, brilho, texto e anel de foco seguem a
  mesma perspectiva. A matriz é recalculada quando o palco muda de tamanho.

  Clicar liga ou desliga a tela; ligada, ela mostra um miniterminal em mono ciano com o `uptime` medido no
  navegador (segundos desde que a página abriu, nada inventado) e um atalho para a seção do terminal. Só existe
  com JS (montado no cliente): sem JS não sobra um botão que não faz nada.
-->
<script lang="ts">
  import { format, getMessages, type Locale } from '$lib/i18n'
  import { say } from '$lib/eggs/state.svelte'
  import { matrixForQuad, type Quad } from './quad'

  let { locale }: { locale: Locale } = $props()

  /** Tamanho lógico do plano da tela (16:10); o texto é dimensionado nessa escala. */
  const PLANE = { width: 480, height: 300 }
  /** Cantos da área visível da tela no quadro, em frações (medidos no pôster 1280×720), no sentido horário. */
  const SCREEN: Quad = [
    [786 / 1280, 397 / 720],
    [1057 / 1280, 407 / 720],
    [1018 / 1280, 616 / 720],
    [741 / 1280, 598 / 720],
  ]

  const t = $derived(getMessages(locale))
  let stage = $state<HTMLElement>()
  let transform = $state<string>()
  let on = $state(false)
  let seconds = $state(0)

  const uptime = () => Math.floor(performance.now() / 1000)

  function toggle() {
    on = !on
    if (on) {
      seconds = uptime()
      say(t.eggs.toast.laptop)
    }
  }

  // A homografia depende do tamanho do palco em pixels (ele acompanha o `cover` do vídeo).
  $effect(() => {
    const element = stage
    if (!element) return
    const place = () => {
      const { clientWidth: width, clientHeight: height } = element
      // Palco escondido (tela estreita): sem tamanho, sem tela.
      if (!width || !height) {
        transform = undefined
        on = false
        return
      }
      const quad = SCREEN.map(([x, y]) => [x * width, y * height] as const) as unknown as Quad
      transform = `matrix3d(${matrixForQuad(PLANE.width, PLANE.height, quad).join(',')})`
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(element)
    return () => observer.disconnect()
  })

  // O relógio só anda com a tela ligada.
  $effect(() => {
    if (!on) return
    const timer = setInterval(() => (seconds = uptime()), 1000)
    return () => clearInterval(timer)
  })
</script>

<div class="laptop" bind:this={stage}>
  {#if transform}
    <div class="laptop__plane" style:width="{PLANE.width}px" style:height="{PLANE.height}px" style:transform data-on={on || undefined}>
      <button class="laptop__wake" type="button" aria-label={t.eggs.laptop.wake} aria-pressed={on} onclick={toggle}></button>
      {#if on}
        <div class="laptop__screen">
          <p class="laptop__prompt">$ whoami</p>
          <p>clebs</p>
          <p class="laptop__prompt">$ uptime</p>
          <p>{format(t.eggs.laptop.uptime, { n: seconds })}</p>
          <a class="laptop__go" href="#terminal">$ <span class="laptop__cursor" aria-hidden="true">▍</span><span class="visually-hidden">{t.home.terminal.open}</span></a>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Do tamanho do palco: a origem das coordenadas da homografia. Só existe em telas largas e deitadas: em telas
     estreitas ou em pé o enquadramento põe o laptop atrás do título e dos botões, e a tela acesa brigaria com
     o texto. Escondido, o palco mede zero e nada é montado. */
  .laptop {
    display: none;
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  @media (min-width: 960px) and (min-aspect-ratio: 5 / 4) {
    .laptop {
      display: block;
    }
  }

  /* O plano da tela: um retângulo de 480×300 levado aos quatro cantos da tela do vídeo. */
  .laptop__plane {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    pointer-events: auto;
    transition:
      background-color 0.4s var(--ease-out),
      box-shadow 0.4s var(--ease-out);
  }

  /* Tela ligada: o brilho do design (ciano a 10 % na tela, 18 % em volta), agora no formato exato dela. */
  .laptop__plane[data-on] {
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
    box-shadow: 0 0 70px 24px color-mix(in srgb, var(--color-accent) 18%, transparent);
  }

  .laptop__wake {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .laptop__wake:focus-visible {
    outline-offset: -6px;
  }

  /* Texto de terminal, do canto superior esquerdo da tela, na escala do plano. */
  .laptop__screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: 26px 30px;
    font-family: var(--font-mono);
    font-size: 17px;
    line-height: 1.6;
    color: var(--color-accent);
    /* Só o botão de baixo recebe cliques na tela; o atalho do terminal liga o ponteiro de volta. */
    pointer-events: none;
    animation: screen-on 0.4s var(--ease-out);
  }

  .laptop__screen p {
    margin: 0;
  }

  /* O cinza dos comandos não tem token: é o do design, entre o creme apagado e o ciano. */
  .laptop__prompt {
    color: #9e9ea0;
  }

  /* 60 px no plano dão ~46 px na tela (o plano é reduzido a uns três quartos pela perspectiva). */
  .laptop__go {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    min-width: 60px;
    min-height: 60px;
    margin-block: -16px;
    color: var(--color-accent);
    pointer-events: auto;
  }

  .laptop__go:focus-visible {
    outline-offset: 0;
  }

  .laptop__cursor {
    margin-inline-start: 0.5ch;
  }

  @media (prefers-reduced-motion: no-preference) {
    .laptop__cursor {
      animation: blink 1s step-end infinite;
    }
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @keyframes screen-on {
    from {
      opacity: 0;
      transform: translateY(14px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes screen-fade {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  /* Movimento reduzido: a tela acende sem subir. */
  @media (prefers-reduced-motion: reduce) {
    .laptop__screen {
      animation-name: screen-fade;
    }

    .laptop__plane {
      transition: none;
    }
  }
</style>
