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

## i18n maintenance

### UI strings (`t()`)

Reusable labels, buttons, navigation, and helper text live in `src/locales/pt-BR.ts`
and `src/locales/en.ts`. Use the `t()` function from `useI18n()`:

```tsx
const { t } = useI18n()
return <h1>{t('blog.title')}</h1>
```

Add a new key by updating both locale files with the same key name.
TypeScript enforces shape parity: `en.ts` uses `typeof ptBR` as its type constraint.

### Structured page copy

Complex page structures (arrays, nested objects, sections) consume
`useI18n().messages` directly instead of flattening into string keys:

```tsx
const { messages } = useI18n()
return messages.home.nowItems.map(item => <li>{item}</li>)
```

This avoids awkward key-chaining for deeply structured content while keeping
the localization source readable.

### Adding a new locale

1. Create the new locale file (e.g., `src/locales/es.ts`)
2. Import and register it in `src/lib/i18n.tsx`
3. Add the locale segment to `src/lib/locale-routing.ts`
4. Run `npm run validate:locale` to check key parity

## Local validation commands

| Command                    | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `npm run typecheck`        | TypeScript compilation check (no emit)        |
| `npm test`                 | Run all Vitest tests                          |
| `npm run validate:editorial` | Validate post/TIL frontmatter and locale rules |
| `npm run validate:locale`    | Check locale key parity across languages       |
| `npm run validate`         | Run all checks (typecheck + tests + editorial + locale) |

Run `npm run validate` before pushing content or code changes.
Invalid frontmatter, missing locale fields, and translation-pair inconsistencies
are caught early with file-and-field-level error messages.

## Build pipeline

```
npm run build
  → generate-rss.mjs   (consumes shared editorial layer)
  → tsc -b              (typecheck)
  → vite build          (React/Vite production build)
  → prerender.mjs       (SSG + SEO injection via shared editorial layer)
  → inline-critical-css.mjs
  → optimize-images.mjs
```

The RSS and prerender scripts no longer parse markdown independently.
They consume the same editorial validation rules through `scripts/editorial-content.mjs`.
