---
slug: hardening-performance-site-estatico-vite-cloudflare
translationKey: hardening-performance-site-estatico-vite-cloudflare
locale: en
title: Redesign, hardening, and performance in a static Vite site
kicker: PERFORMANCE
date: 2026-04-27
readingTime: 20 MIN READ
author: whoisclebs
excerpt: A technical study about editorial rebranding, Markdown content, safe supply chain, TypeScript 6, critical CSS, image optimization, and Cloudflare for a static site.
cover: /cover/d&d.png
coverAlt: Pixel art illustration of a completed quest in a fantasy scene
published: true
---

A personal website looks small until it becomes a product. It has a visual identity, content architecture, SEO, deployment rules, dependencies, a public attack surface, and performance expectations. Being static removes a lot of operational complexity, but it does not remove engineering. This update treated whoisclebs.com as a small editorial product: redesign, hardening, and performance were handled together.

The goal was not only to change colors or publish more posts. The goal was to reposition the site as an independent technical publication: closer to an engineering magazine than to a generic personal landing page. That required decisions about brand, layout, Markdown content, RSS, comments, GitHub Pages compatibility, Cloudflare delivery, dependency security, and render-blocking resources.

## Editorial brand, not a portfolio template

The rebranding started with a product direction: the site should feel like an authored engineering publication. The visual system uses high contrast, dense headlines, visible grid lines, uppercase metadata, no shadows, no rounded editorial containers, and a restrained blue accent for action.

The design rules are intentionally small:

- white paper background and near-black ink;
- thin borders as structure;
- large sans-serif headlines;
- serif text for long reading;
- mono uppercase metadata;
- rectangular images without decorative radius;
- the same layout grammar across home, blog, TIL, portfolio, books, hobbies, and about.

This is the difference between a redesign and a skin. A skin changes components in isolation. A redesign defines repeated decisions that survive new pages and new content.

## Minimal tokens instead of a heavy design system

The site does not need a corporate design system. It needs enough shared rules to avoid visual drift. The implementation is Tailwind-first, with a minimal global theme.

```css
@import "tailwindcss";

@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-serif: Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Monaco, "Courier New", monospace;
}
```

Using system fonts was a performance decision and a branding decision. The editorial feeling remains, but the browser no longer needs Google Fonts before rendering text.

## Markdown as the editorial contract

Posts and TIL entries are local Markdown files. This keeps the editorial source versioned with the code, reviewable in pull requests, and available to the build pipeline without a CMS.

Each post has frontmatter metadata and a Markdown body:

```text
---
slug: hardening-performance-site-estatico-vite-cloudflare
locale: en
title: Redesign, hardening, and performance in a static Vite site
kicker: PERFORMANCE
published: true
---
```

The parser is intentionally small. It supports frontmatter, paragraphs, level-two headings, lists, and code blocks. That is enough for this editorial format and avoids bringing a larger Markdown or MDX runtime into the project.

## Locale-aware content

Internationalization has two layers. The first layer is interface language: navigation, footer, pagination, empty states, and metadata. The second layer is editorial content. The implementation detects the browser language on the first visit, then persists the user-selected language in `localStorage`.

The behavior is:

- if `whoisclebs.locale` exists, use it;
- otherwise inspect `navigator.language` and `navigator.languages`;
- normalize Portuguese variants to `pt-BR`;
- normalize English variants to `en`;
- fallback to `pt-BR`;
- update `document.documentElement.lang` on every change.

This makes first visits feel native while keeping returning visits stable. A user who explicitly selected English should not be switched back just because the browser changed.

## Blog pagination and editorial grids

The blog uses a fixed page size of ten posts. This keeps the page predictable as the archive grows. The grid uses six columns on desktop. Normal cards span two columns; if the last row has two cards, each spans three columns; if it has one card, it spans the full row.

```typescript
export function getBalancedEditorialGridItemClass(index: number, count: number): string {
  const remainder = count % 3

  if (remainder === 1 && index === count - 1) return 'md:col-span-6'
  if (remainder === 2 && index >= count - 2) return 'md:col-span-3'
  return 'md:col-span-2'
}
```

This is a visual rule encoded as a testable function. The layout adapts to real content volume instead of requiring manual page tweaks.

## RSS is generated by the build

An editorial site should be readable outside the UI. RSS is simple, open, and ideal for technical writing. The build generates `/rss/blog.xml` and `/rss/til.xml` from Markdown metadata. The feed is not manually edited; it is an artifact of the same content source used by the site.

## GitHub Pages and SPA fallback

React Router handles client-side routes, while GitHub Pages serves static files. Deep links like `/blog/my-post` need a fallback because GitHub Pages does not know the SPA route table. The build copies the final `index.html` to `404.html`, so unknown server paths still load the app and React Router resolves the route.

## Security.txt as a public reporting contract

The update added `public/.well-known/security.txt`, designed to be served at `https://whoisclebs.com/.well-known/security.txt` through Cloudflare.

```text
Contact: mailto:hello@whoisclebs.com
Contact: https://github.com/whoisclebs/whoisclebs.com/security/advisories/new
Expires: 2027-04-27T23:59:59Z
Preferred-Languages: pt-BR, en
Canonical: https://whoisclebs.com/.well-known/security.txt
```

For a personal site, this does not need to mimic an enterprise bug bounty program. It needs to be clear, reachable, and honest.

## Deterministic supply chain

The deployment uses `npm ci`, not `npm install`. That matters because `npm ci` installs exactly what is in the lockfile and fails when the dependency tree is inconsistent.

The deploy failure exposed a peer dependency mismatch between `eslint@10.2.1` and `eslint-plugin-react-hooks@5.2.0`. The correct fix was not `--legacy-peer-deps`; it was aligning ESLint with the version range supported by the React plugins.

```json
{
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "eslint": "^9.39.4"
  }
}
```

Major toolchain updates should be treated like platform migrations. If the ecosystem does not declare compatibility, forcing the install only moves the problem to the next CI run.

## TypeScript 6 without unnecessary suppression

TypeScript 6 warned about `baseUrl` deprecation. The first workaround was to silence it with `ignoreDeprecations`, but the better fix was removing the deprecated option entirely.

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

With bundler module resolution and Vite, the alias still works. Suppression should be temporary and justified. If the deprecated setting can be removed safely, remove it.

## Audit and toolchain updates

The audit exposed vulnerabilities in development tooling. Even when the final output is static, build-time dependencies matter because they run on developer machines and CI.

The final update moved to:

```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.1",
    "vite": "^8.0.10",
    "vitest": "^4.1.5"
  },
  "overrides": {
    "flatted": "3.4.2"
  }
}
```

After that, `npm audit` reported zero vulnerabilities.

## Critical rendering path

The original Lighthouse report showed a classic webfont chain: HTML, CSS, Google Fonts CSS, several WOFF2 files, and then the application JavaScript. The issue was not only transfer size. It was latency chaining.

Removing Google Fonts eliminated the external font chain. Inlining the small generated CSS removed another render-blocking request. The site now has fewer things to discover before painting meaningful text.

## Inlining CSS during the build

The generated CSS is around 30 KiB raw and around 6.5 KiB gzip. For this site, inlining it into `index.html` is a reasonable tradeoff: the HTML becomes larger, but the first render no longer waits on a separate stylesheet request.

The build runs a small script after Vite:

```js
const html = await readFile(htmlPath, 'utf8')
const match = html.match(stylesheetPattern)

if (match?.groups?.href) {
  const cssPath = join(distDir, match.groups.href.replace(/^\//, ''))
  const css = await readFile(cssPath, 'utf8')
  await writeFile(htmlPath, html.replace(match[0], `<style>${css}</style>`))
}
```

This would not be my default for every application, but it is appropriate here because the CSS is small, shared, and required for every route.

## Build-time image optimization

Images under `public/` are copied by Vite without transformation. The build now runs Sharp after `vite build`, walking the `dist` directory and recompressing images.

The optimizer:

- supports JPG, JPEG, PNG, and WebP;
- rotates based on metadata;
- resizes images wider than 1800px;
- uses palette PNG compression where beneficial;
- only overwrites files when the optimized output is smaller.

The validated build saved almost 9 MiB:

```text
Optimized 8 images, saved 8993.0 KiB
```

This is the kind of optimization that belongs in automation. It should not depend on remembering to run a manual image compressor before every commit.

## Cloudflare responsibilities

The build reduces payload and removes critical requests, but Cloudflare still has to serve the result well. The edge configuration should guarantee Brotli or gzip compression, long cache for hashed assets, shorter cache for HTML, and no accidental redirect for `/.well-known/security.txt`.

Good static delivery is split responsibility: the build produces efficient artifacts; the edge serves them with the right caching and compression semantics.

## Validation

The validation suite covers both content and platform behavior:

```text
npm ci
npm audit
npm run lint
npm test
npm run build
```

The relevant outcomes were:

- deterministic install passes;
- audit has zero vulnerabilities;
- tests cover pagination, content lookup, i18n detection, and UI structure;
- build generates RSS, bundles with Vite, inlines CSS, optimizes images, and copies the SPA fallback.

## The result

The final result is not just a faster page. It is a more coherent editorial platform: a stronger visual identity, Markdown as a content contract, locale-aware UI, RSS generation, public security reporting, deterministic dependency management, fewer critical requests, and automated asset optimization.

The redesign made the site feel intentional. The hardening made it safer to operate. The performance work made the first render less dependent on external chains. Together, those changes turned a personal website into a maintainable static publishing system.
