<!--
  Ícone de app da gaveta: quadrado arredondado com degradê da paleta do site e um glifo de traço simples
  (grade de 24, traço de 1,7). Nada de emoji nem logos: GitHub e LinkedIn têm glifos genéricos (ramo, crachá).
-->
<script lang="ts">
  import type { Glyph, Tint } from './model'

  let { glyph, tint }: { glyph: Glyph; tint: Tint } = $props()

  /** Traços de cada glifo; `dots` são pontos cheios (pips do dado, ponto do RSS, olho da serpente). */
  const GLYPHS: Record<Glyph, { d: string; dots?: [number, number, number][] }> = {
    writing: { d: 'M6 5h12M6 9.5h12M6 14h8M6 18.5h5' },
    projects: { d: 'M9 7.5 4.5 12 9 16.5M15 7.5l4.5 4.5-4.5 4.5M13.2 5.5l-2.4 13' },
    about: { d: 'M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 19.5c1.3-3.6 3.9-5.3 7-5.3s5.7 1.7 7 5.3' },
    notes: { d: 'M5.5 4.5h13v10l-5 5h-8zM13.5 19.5v-5h5M8.5 9h7M8.5 12.5h4' },
    books: { d: 'M4.5 4.5h4v15h-4zM9.5 4.5h4v15h-4zM15 5.6l3.6-1 3.4 14.2-3.6 1z' },
    hobbies: { d: 'M12 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM9.7 10.5h4.6l1.3 6.2H8.4zM7 19.5h10' },
    contact: { d: 'M4 6.5h16v11H4zM4.5 7.2l7.5 5.6 7.5-5.6' },
    rss: { d: 'M5.5 4.5a14 14 0 0 1 14 14M5.5 10.5a8 8 0 0 1 8 8', dots: [[6.5, 17.5, 1.6]] },
    github: { d: 'M7.5 5.5v13M16.5 9.5c0 4.5-9 3-9 9M7.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7.5 20.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z' },
    linkedin: { d: 'M4 5.5h16v13H4zM6.8 16c.5-1.7 1.4-2.5 2.4-2.5s1.9.8 2.4 2.5M14 10h3.5M14 13.5h3.5M9.2 11.8a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z' },
    video: { d: 'M3.5 6.5h17v11h-17zM10.3 9.3v5.4l4.6-2.7z' },
    letter: { d: 'M6.5 4.5h11v15l-5.5-3.6-5.5 3.6zM9.5 8.5h5' },
    link: { d: 'M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.1 1.1M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.1-1.1' },
    snake: { d: 'M17.5 6.5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H5.5', dots: [[17.5, 6.5, 1.6]] },
    dice: {
      d: 'M5 5h14v14H5z',
      dots: [
        [9, 9, 1.4],
        [15, 9, 1.4],
        [12, 12, 1.4],
        [9, 15, 1.4],
        [15, 15, 1.4],
      ],
    },
    neon: { d: 'M13.5 3.5 6.5 13h5l-1 7.5 7-9.5h-5z' },
    scene: { d: 'M7.5 14.5a3.8 3.8 0 1 1 1-7.4 5 5 0 0 1 9.4 1.6 2.9 2.9 0 0 1-.4 5.8zM8.5 17.5l-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5' },
  }

  const shape = $derived(GLYPHS[glyph])
</script>

<span class="icon icon--{tint}" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d={shape.d} />
    {#each shape.dots ?? [] as [cx, cy, r], index (index)}
      <circle {cx} {cy} {r} fill="currentColor" stroke="none" />
    {/each}
  </svg>
</span>

<style>
  .icon {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 24%;
    overflow: hidden;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.18),
      inset 0 -1px 0 rgb(0 0 0 / 0.25),
      0 2px 6px rgb(0 0 0 / 0.35);
  }

  /* Brilho de cima: o mesmo para todos, para a grade parecer uma família só. */
  .icon::before {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgb(255 255 255 / 0.14), transparent 46%);
    content: '';
  }

  svg {
    position: relative;
    width: 54%;
    height: 54%;
  }

  .icon--ink {
    background: linear-gradient(160deg, #30333a, #17181c);
    color: var(--color-accent);
  }

  .icon--cyan {
    background: linear-gradient(160deg, #8ae6f2, #2f9fb4);
    color: var(--p-ink-deep);
  }

  .icon--cream {
    background: linear-gradient(160deg, #f6f1e8, #c9c1b3);
    color: var(--p-ink);
  }

  .icon--pink {
    background: linear-gradient(160deg, #ff5cc6, #a3106e);
    color: var(--p-cream);
  }

  .icon--green {
    background: linear-gradient(160deg, #9ae8bb, #3b9364);
    color: var(--p-ink-deep);
  }
</style>
