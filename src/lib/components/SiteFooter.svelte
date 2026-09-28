<script lang="ts">
  import { contactEmail, socialLinks } from '$lib/content/library'
  import { getMessages, type Locale } from '$lib/i18n'
  import { pagePath, pagePathOrDefault, type PageKey } from '$lib/routing/paths'

  let {
    locale,
    currentPath = '',
    scene = true,
  }: {
    locale: Locale
    currentPath?: string
    /** Noite do farol com a camada animada. Na 404 o vídeo do ciclo já mostra o farol: o rodapé fica só no céu. */
    scene?: boolean
  } = $props()

  let sky = $state<HTMLElement>()
  let canvas = $state<HTMLCanvasElement>()
  let image = $state<HTMLImageElement>()

  const SCENE_WIDTHS = [960, 1600, 2560]
  const srcset = (format: 'avif' | 'webp') => SCENE_WIDTHS.map((w) => `/scene/footer-night-${w}.${format} ${w}w`).join(', ')
  // Até 639 px a cena tem 440 px de altura e o cover a mostra com ~782 px de largura; acima, a largura da tela.
  const sizes = '(max-width: 639px) 782px, 100vw'

  // A camada animada é uma ilha: o código (`footer/scene.ts`) só é baixado quando o rodapé se aproxima da
  // viewport, e só roda com ele visível (a própria ilha pausa fora da tela e com a aba oculta).
  $effect(() => {
    if (!scene || !sky || !canvas || !image || !('IntersectionObserver' in window)) return
    const root = sky
    const layer = canvas
    const picture = image
    let stop: (() => void) | undefined
    let cancelled = false
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        near.disconnect()
        void import('./footer/scene').then(({ startScene }) => {
          if (!cancelled) stop = startScene(root, layer, picture)
        })
      },
      { rootMargin: '400px 0px' },
    )
    near.observe(root)
    return () => {
      cancelled = true
      near.disconnect()
      stop?.()
    }
  })

  const t = $derived(getMessages(locale))
  const c = $derived(t.closing)
  const contactPage = $derived(pagePath('contact', locale))
  // Na própria página de contato o convite repetiria o conteúdo acima dele.
  const showInvite = $derived(!contactPage || currentPath !== contactPage)

  // Notas e Agentes só existem em pt-BR: no inglês, o link vai para a página em português, marcado.
  const secondary = $derived(
    (
      [
        ['notes', t['nav.notes']],
        ['books', t['nav.books']],
        ['hobbies', t['nav.hobbies']],
        ['agents', t['nav.agents']],
      ] as const satisfies readonly (readonly [PageKey, string])[]
    ).map(([key, label]) => ({ href: pagePathOrDefault(key, locale), label, fallback: !pagePath(key, locale) })),
  )
  const legal = $derived([
    { href: pagePathOrDefault('privacy', locale), label: t['footer.privacy'] },
    { href: pagePathOrDefault('terms', locale), label: t['footer.terms'] },
  ])
  const feed = $derived(locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml')
</script>

<!--
  O rodapé fecha o dia: o papel escurece num entardecer (degradê) e vira a noite do Farol do Cabo Branco
  (ilustração em AVIF/WebP, `scripts/build-footer-scene.mjs`). Convite, links e atividade ficam direto no céu;
  o contraste é medido no e2e sobre os pixels da imagem. Sem JS: só a imagem.
-->
<footer class="site-footer band-night band-sky" data-footer-scene={scene ? 'on' : 'off'}>
  {#if scene}<div class="dusk" data-band-edge="dusk" aria-hidden="true"></div>{/if}
  <div class="sky" bind:this={sky}>
    {#if scene}<canvas class="sky__layer" bind:this={canvas} aria-hidden="true"></canvas>{/if}
    <div class="page sky__content">
      {#if showInvite}
      <section class="invite" aria-labelledby="footer-invite-title">
        <h2 id="footer-invite-title" class="invite__title">{c.inviteTitle}</h2>
        <div class="invite__body">
          <p>{c.inviteText}</p>
          <a class="invite__mail" href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </div>
      </section>
      {/if}

      <div class="columns">
        <nav class="col col--contact" aria-labelledby="footer-contact-title">
          <h2 id="footer-contact-title" class="col__title">{c.contactHeading}</h2>
          <ul>
            {#if contactPage}<li><a href={contactPage} aria-current={showInvite ? undefined : 'page'}>{c.contactPage}</a></li>{/if}
            {#each socialLinks as link (link.href)}
              <li><a href={link.href} rel="noopener noreferrer me">{link.label}</a></li>
            {/each}
          </ul>
        </nav>

        <div class="col col--read">
          <h2 id="footer-read-title" class="col__title">{c.readHeading}</h2>
          <ul aria-labelledby="footer-read-title">
            <li><a href={feed} type="application/rss+xml">{c.rss}</a></li>
            <!-- /resume.json: JSON Resume gerado do conteúdo (src/lib/server/publishing/resume.ts). -->
            <li><a href="/resume.json" type="application/json">{c.resume}</a></li>
          </ul>
          <nav aria-label={t['nav.secondary']}>
            <h2 class="col__title col__title--sub">{c.moreHeading}</h2>
            <ul>
              {#each secondary as item (item.href)}
                <li>
                  <a href={item.href} hreflang={item.fallback ? 'pt-BR' : undefined}>{item.label}</a>{#if item.fallback}<span class="fallback"> {c.ptOnly}</span>{/if}
                </li>
              {/each}
            </ul>
          </nav>
        </div>
      </div>
    </div>

    {#if scene}
      <div class="scene" aria-hidden="true">
        <picture>
          <source type="image/avif" srcset={srcset('avif')} {sizes} />
          <source type="image/webp" srcset={srcset('webp')} {sizes} />
          <img class="scene__image" bind:this={image} src="/scene/footer-night-1600.webp" width="2560" height="1440" alt="" loading="lazy" decoding="async" />
        </picture>
      </div>
    {/if}
  </div>

  <div class="page colophon">
    <p>{c.colophon} {t['footer.madeWith']}</p>
    <ul aria-label={locale === 'en' ? 'Legal' : 'Jurídico'}>
      {#each legal as item (item.href)}<li><a href={item.href}>{item.label}</a></li>{/each}
    </ul>
  </div>
</footer>

<style>
  .site-footer {
    background: var(--p-ground);
    color: var(--color-text);
  }

  /*
   * Anoitecer (páginas internas): do papel da leitura ao céu do farol, escurecendo em azul, sem marrom nem
   * rosa. Na home a jornada já termina no tom exato do topo da ilustração, então não há faixa.
   */
  .dusk {
    height: clamp(120px, 14vw, 220px);
    background: linear-gradient(
      to bottom,
      var(--color-page) 0%,
      color-mix(in oklab, #9fb0cf 45%, var(--color-page)) 28%,
      color-mix(in oklab, #3f5282 70%, var(--color-page)) 56%,
      color-mix(in oklab, var(--p-sky-top) 88%, #3f5282) 80%,
      var(--p-sky-top) 100%
    );
  }

  :global(main.main--bleed) + .site-footer .dusk {
    display: none;
  }

  /* O céu tem a cor exata do topo da ilustração (amostrada): o texto fica nele e a imagem se dissolve nele. */
  .sky {
    position: relative;
    isolation: isolate;
    background: var(--p-sky-top);
  }

  .sky__layer {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .sky__content {
    position: relative;
    z-index: 2;
  }

  /*
   * A ilustração entra por baixo do fim do texto, inteira: o topo (só céu, acima da lâmpada) some numa máscara
   * de degradê e vira o mesmo céu do bloco de cima, sem borda; a base desce para o chão do colofão. No desktop
   * ela tem o tamanho natural (16:9 da largura), com o farol à direita e a grama e os vaga-lumes embaixo.
   */
  .scene {
    position: relative;
    z-index: 0;
    height: clamp(440px, 80vw, 620px);
    margin-block-start: calc(-1 * clamp(24px, 6vw, 64px));
    background: linear-gradient(to bottom, transparent 70%, var(--p-ground) 100%);
  }

  .scene__image {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
    object-fit: cover;
    object-position: 68% 100%;
    /* Preto uniforme de 12 % sobre a imagem inteira (decisão do proprietário, decisions.md 98): equivale a
       `brightness(0.88)` e acompanha a máscara, sem borda. A camada canvas (facho, estrelas, vaga-lumes) fica acima. */
    filter: brightness(0.88);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 16%, #000 92%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0, #000 16%, #000 92%, transparent 100%);
  }

  /*
   * Desktop: a ilustração no enquadramento natural (16:9 da largura, `object-position` 68 % 100 %, farol no terço
   * direito, inteiro, da lâmpada à grama), presa embaixo do rodapé. O conteúdo fica por cima e termina a 24vw da
   * base; se for mais alto que a imagem, o topo dele sobe para o céu liso, que é a mesma cor do topo da imagem
   * (máscara, sem corte).
   */
  @media (min-width: 960px) {
    .sky {
      min-height: 56.25vw;
    }

    .scene {
      position: absolute;
      inset: auto 0 0;
      height: 56.25vw;
      margin: 0;
    }
  }

  /* Sem a cena (404): só a noite, sem anoitecer. */
  .site-footer[data-footer-scene='off'] .sky {
    background: var(--p-night);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Convite: o gesto de "Contato" do colofão (C), em Anton, sobre o papel. */
  .invite {
    display: grid;
    gap: var(--space-5);
    /* Sem fio entre o convite e as colunas (pedido do proprietário). */
    padding-block: var(--space-8) var(--space-7);
  }

  /* Menor que o H1 da home (--step-5): o convite fecha a página, não compete com a tese. */
  .invite__title {
    max-width: 16ch;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 1.2rem + 4.4vw, 5rem);
    font-weight: 400;
    line-height: var(--leading-display);
    letter-spacing: var(--tracking-display);
    text-wrap: balance;
  }

  .invite__body {
    display: grid;
    align-content: end;
    gap: var(--space-4);
  }

  .invite__body p {
    max-width: 40ch;
    color: var(--color-text-soft);
  }

  .invite__mail {
    justify-self: start;
    font-family: var(--font-display);
    font-size: var(--step-3);
    line-height: var(--leading-heading);
    text-decoration-thickness: 2px;
    text-underline-offset: 0.12em;
    overflow-wrap: anywhere;
  }

  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-7) var(--space-5);
    padding-block: var(--space-7) var(--space-6);
  }

  .col {
    display: grid;
    align-content: start;
    gap: var(--space-3);
  }

  .col__title {
    color: var(--color-text-faint);
    font-family: var(--font-mono);
    font-size: var(--step--1);
    font-weight: 400;
    line-height: var(--leading-ui);
  }

  .col__title--sub {
    margin-block: var(--space-5) var(--space-3);
  }

  .col li {
    padding-block: var(--space-1);
    font-size: var(--step-0);
    line-height: var(--leading-ui);
  }

  .fallback {
    color: var(--color-text-faint);
    font-size: var(--step--1);
  }

  .colophon {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-2) var(--space-5);
    padding-block: var(--space-4) var(--space-6);
    color: var(--color-text-faint);
    font-family: var(--font-mono);
    font-size: var(--step--2);
    line-height: var(--leading-ui);
  }

  .colophon ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
  }

  @media (min-width: 640px) {
    .columns {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    .col--contact,
    .col--read {
      grid-column: span 3;
    }

  }

  /*
   * Desktop: exatamente o layout de largura total do rodapé em fundo liso ("Contato" gigante nas colunas 1–6,
   * texto + e-mail nas 7–12; fio de largura cheia; Perfis 1–3 | Ler e acompanhar + Mais do site 4–6; a atividade
   * pública saiu do rodapé a pedido do proprietário), por cima da ilustração. O texto pode passar sobre o farol (decisão do
   * proprietário, decisions.md 98): uma sombra escura de 1 px, sem desfoque, ajuda sobre o branco da torre.
   */
  @media (min-width: 960px) {
    .sky__content {
      min-height: 56.25vw;
      /* Disposição aprovada pelo proprietário: a lâmpada fica logo abaixo do e-mail, sobre o fio. */
      padding-block-end: 17vw;
      text-shadow: 0 1px 0 rgb(8 13 25 / 0.9);
    }

    .invite {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      padding-block-start: var(--space-8);
    }

    /* Texto e e-mail embaixo do título "Contato", na mesma coluna (pedido do proprietário). */
    .invite__title {
      grid-column: 1 / span 6;
    }

    .invite__body {
      grid-column: 1 / span 6;
    }

    .columns {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--grid-gap);
      padding-block-end: 0;
    }

    .col--contact {
      grid-column: 1 / span 3;
    }

    .col--read {
      grid-column: 4 / span 3;
    }

  }
</style>
