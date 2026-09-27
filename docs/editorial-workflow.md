# Editorial Workflow

## Adding or evolving a blog post

### Directory convention

Posts live under `src/content/posts/<YYYY-MM-DD>-<slug>/`:

```
src/content/posts/
  2026-04-27-hardening-performance-site-estatico-vite-cloudflare/
    pt-BR.md
    en.md
  2025-09-16-github-actions-como-fazer-deploy/
    pt-BR.md
    en.md
```

Each entry directory contains one file per locale. The date prefix (*YYYY-MM-DD*) matches
the `date` field in the frontmatter and helps chronological scanning in the IDE and GitHub.

### Required frontmatter

Every post **must** include:

```yaml
---
slug: my-post-slug
title: Título do post
kicker: ENGINEERING
date: 2026-07-05
readingTime: 5 MIN DE LEITURA
author: whoisclebs
excerpt: A short summary of the post.
cover: /cover/my-image.png
coverAlt: Alt text for the cover image
published: true
locale: pt-BR
translationKey: my-post-slug    # required when a translated counterpart exists
---
```

All fields except `locale` and `translationKey` are required for every post.
`locale` must be explicit (`pt-BR` or `en`) on all localized files.
`translationKey` must be present on **both** files of a translation pair and equal to the slug.

### Invariant vs. localizable fields

| Field           | Must match across PT/EN? |
| --------------- | ------------------------ |
| `slug`          | Yes                      |
| `translationKey`| Yes                      |
| `date`          | Yes                      |
| `cover`         | Yes                      |
| `author`        | Yes                      |
| `published`     | Yes (same review state)  |
| `title`         | No — adapt for locale    |
| `excerpt`       | No — adapt for locale    |
| `coverAlt`      | No — adapt for locale    |
| `readingTime`   | No — adapt for locale    |

### Creating a new post

1. Create the entry directory: `src/content/posts/<YYYY-MM-DD>-<slug>/`
2. Write `pt-BR.md` with the full Portuguese content and required frontmatter
3. If publishing only in PT for now, omit `translationKey`
4. Run `npm run validate:editorial` to check for metadata errors

### Adding an English translation

1. Create `en.md` in the same entry directory as the PT source
2. Copy the invariant metadata (slug, date, cover, author, published)
3. Add `locale: en` and `translationKey` (same value as the slug)
4. Translate title, excerpt, coverAlt, readingTime — prefer non-literal adaptation
5. Translate body preserving technical meaning, tone, and authorial voice
6. Code blocks remain technically identical
7. Run `npm run validate:editorial` to check translation pairing

### Ordering

Posts are ordered reverse-chronologically by `date`. Ties are broken by slug alphabetically.
This ordering is deterministic and shared across app, RSS, and prerender.

## Adding a TIL entry

TIL entries live at `src/content/til/<slug>.md` with this frontmatter:

```yaml
---
slug: docker-healthcheck-para-servicos
title: Docker healthcheck para serviços pequenos
kicker: DEVOPS
date: 2026-04-27
excerpt: Short description of what you learned.
published: true
locale: pt-BR
---
```

TIL does not currently require translation backfill but follows the same editorial layer.

## Manutenção de i18n (SvelteKit, desde o passo 02 do redesign)

Textos de interface ficam em `src/lib/i18n/pt-BR.ts` e `src/lib/i18n/en.ts`; `en.ts` é tipado como
`typeof ptBR`, então o TypeScript exige a mesma forma. Nos componentes:

```svelte
<script lang="ts">
  import { getMessages } from '$lib/i18n'
  let { data } = $props()
  const t = $derived(getMessages(data.locale))
</script>
<h1>{t['blog.title']}</h1>
```

O idioma vem **só da URL** (`localeFromPath`: `/en/...` é inglês, o resto é pt-BR); não há detecção por
navegador nem `localStorage`. Caminhos por idioma ficam em `src/lib/routing/paths.ts`.

## Camada de conteúdo

- Markdown: `src/content/posts/<data-slug>/{pt-BR,en}.md` (Escrita) e `src/content/til/*.md` (Notas).
- Carregamento tipado: `src/lib/content/{posts,notes}.ts`, com schemas Zod em `src/lib/content/schema.ts`
  (datas ISO reais, idioma, `published`, capa https ou caminho público, `sources` opcional com URLs,
  `updated` opcional). Conteúdo inválido lança erro no carregamento e **o build falha**.
- Dados pequenos (projetos, livros, jogos, badges, perfis) ficam em `src/lib/content/{projects,library}.ts`,
  também validados por Zod.
- Markdown vira HTML no prerender (`src/lib/server/markdown.ts`: marked + Shiki); nenhum highlighter vai
  para o cliente.

## Comandos locais

| Comando | Para quê |
| --- | --- |
| `npm run check` | svelte-check + tsc estrito (0 erros, 0 avisos) |
| `npm run lint` | ESLint (TS + Svelte) |
| `npm test` | Vitest (schemas, i18n, redirects, Markdown) |
| `npm run validate:editorial` | Front matter de artigos/notas contra os schemas Zod |
| `npm run validate:locale` | Paridade profunda de chaves pt-BR × en |
| `npm run build` | validações → `vite build` (prerender + adapter-cloudflare) → otimização de imagens |
| `npm run preview` | `wrangler dev` sobre `.svelte-kit/cloudflare` |
| `npm run test:e2e` | Playwright: paridade das URLs antigas, head por página, 404 real |

RSS (`/rss/blog.xml`, `/rss/blog-en.xml`, `/rss/til.xml`) e `sitemap.xml` são rotas `+server.ts`
prerenderizadas a partir do mesmo conteúdo (`src/lib/server/feeds.ts`).
