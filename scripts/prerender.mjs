/**
 * scripts/prerender.mjs
 *
 * SSG prerender step — runs after `vite build`.
 *
 * For every public route the prerendered React app HTML is injected into the
 * Vite-built template (`dist/index.html`) and written to `dist/<rota>/index.html`.
 * Page-specific <title>, <meta>, and JSON-LD tags are injected based on route
 * metadata so that crawlers see the correct SEO payload without JS.
 *
 * Usage (part of `npm run build`):
 *   vite build && node scripts/prerender.mjs
 */

import { createServer } from 'vite'
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const distDir = 'dist'
const siteUrl = 'https://whoisclebs.com'
const siteName = 'Clebson Augusto'
const defaultTitle = `${siteName} - Engenharia de software sem teatro`
const defaultDescription =
  'Blog e portfólio de Clebson A. Fonseca sobre engenharia de software, arquitetura, pagamentos, frontend e operação.'
const defaultImage = `/profile/clebson.png`

// ── Helpers ──────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { metadata: {} }
  const metadata = Object.fromEntries(
    match[1].split(/\r?\n/).map((line) => {
      const index = line.indexOf(':')
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    }),
  )
  return { metadata }
}

function getPublishedPosts(dir, isEn) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && (isEn ? f.endsWith('.en.md') : !f.endsWith('.en.md')))
    .map((f) => parseFrontmatter(readFileSync(join(dir, f), 'utf8')).metadata)
    .filter((m) => m.published !== 'false')
}

function getPublishedTilEntries(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseFrontmatter(readFileSync(join(dir, f), 'utf8')).metadata)
    .filter((m) => m.published !== 'false')
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ── SEO helpers ──────────────────────────────────────────────────────

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Clebson A. Fonseca',
  url: siteUrl,
  image: `${siteUrl}/profile/clebson.png`,
  sameAs: [
    'https://github.com/whoisclebs',
    'https://linkedin.com/in/whoisclebs',
    'https://dribbble.com/whoisclebs',
  ],
  jobTitle: 'Software Engineer',
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: siteUrl,
  description: defaultDescription,
}

/**
 * Inject SEO `<title>`, `<meta>`, `<link rel="canonical">`, `<link rel="alternate" hreflang="…">`,
 * and JSON-LD into a built HTML string.
 *
 * @param {string} html
 * @param {{ title, description, url, image, type, jsonLd, locale }} seo
 * @param {string[]} [hreflangLinks=[]]  — array of fully-formed `<link rel="alternate" hreflang="…">` tags
 */
function injectSeoTags(html, { title, description, url, image, type, jsonLd, locale }, hreflangLinks = []) {
  const imageUrl = image?.startsWith('http') ? image : `${siteUrl}${image ?? defaultImage}`
  const escapedTitle = escapeHtml(title)
  const escapedDescription = escapeHtml(description)
  const escapedUrl = escapeHtml(url)
  const escapedImageUrl = escapeHtml(imageUrl)

  // Replace <title>
  html = html.replace(/<title>.*?<\/title>/, `<title>${escapedTitle}</title>`)

  // Set <html lang>
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${locale === 'en' ? 'en' : 'pt-BR'}"`)

  // Replace or inject meta / JSON-LD before </head>
  const tags = [
    `<meta name="description" content="${escapedDescription}" />`,
    `<meta property="og:title" content="${escapedTitle}" />`,
    `<meta property="og:description" content="${escapedDescription}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${escapedUrl}" />`,
    `<meta property="og:image" content="${escapedImageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapedTitle}" />`,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
    `<meta name="twitter:image" content="${escapedImageUrl}" />`,
    `<link rel="canonical" href="${escapedUrl}" />`,
    ...hreflangLinks,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ]

  html = html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`)

  return html
}

/**
 * Build `<link rel="alternate" hreflang="…">` tags for routes that exist in
 * both Portuguese (pt-BR) and English (en).
 *
 * Static pages that exist in both languages use a hard‑coded mapping.
 * Blog posts check whether the counterpart translation exists via ptPosts/enPosts.
 *
 * Returns an empty array when the route has no alternative language version.
 */
function getHreflangLinks(route, ptPosts, enPosts) {
  // ── Bilateral static-pages mapping ──────────────────────────────────
  const ptToEn = {
    '/': '/en/',
    '/about': '/en/about',
    '/blog': '/en/blog',
    '/portfolio': '/en/portfolio',
    '/hobbies': '/en/hobbies',
    '/books': '/en/books',
    '/privacy-policy': '/en/privacy-policy',
    '/terms-of-use': '/en/terms-of-use',
  }

  const enToPt = Object.fromEntries(
    Object.entries(ptToEn).map(([pt, en]) => [en, pt]),
  )

  const toUrl = (r) => {
    if (r === '/' || r === '/en/') return `${siteUrl}${r}`
    return `${siteUrl}${r}`
  }

  const links = []

  // 1. Static pages
  if (route in ptToEn) {
    const enRoute = ptToEn[route]
    links.push(`<link rel="alternate" hreflang="pt-BR" href="${escapeHtml(toUrl(route))}" />`)
    links.push(`<link rel="alternate" hreflang="en" href="${escapeHtml(toUrl(enRoute))}" />`)
  } else if (route in enToPt) {
    const ptRoute = enToPt[route]
    links.push(`<link rel="alternate" hreflang="pt-BR" href="${escapeHtml(toUrl(ptRoute))}" />`)
    links.push(`<link rel="alternate" hreflang="en" href="${escapeHtml(toUrl(route))}" />`)
  }

  // 2. Blog posts (check if the counterpart translation exists)
  const blogMatch = route.match(/^\/(en\/)?blog\/(.+)/)
  if (blogMatch) {
    const isEn = !!blogMatch[1]
    const slug = blogMatch[2]

    if (isEn ? ptPosts.some((p) => p.slug === slug) : enPosts.some((p) => p.slug === slug)) {
      links.push(`<link rel="alternate" hreflang="pt-BR" href="${escapeHtml(`${siteUrl}/blog/${slug}`)}" />`)
      links.push(`<link rel="alternate" hreflang="en" href="${escapeHtml(`${siteUrl}/en/blog/${slug}`)}" />`)
    }
  }

  return links
}

// ── Route → SEO mapping ─────────────────────────────────────────────

/**
 * Return SEO metadata for a given route path.
 */
function getSeoForRoute(route, ptPosts, enPosts, tilEntries) {
  // --- Blog posts (PT and EN) ---
  const blogMatch = route.match(/^\/(en\/)?blog\/(.+)/)
  if (blogMatch) {
    const isEn = !!blogMatch[1]
    const slug = blogMatch[2]
    const posts = isEn ? enPosts : ptPosts
    const post = posts.find((p) => p.slug === slug)
    if (post) {
      const postUrl = isEn ? `${siteUrl}/en/blog/${slug}` : `${siteUrl}/blog/${slug}`
      const coverImage = post.cover || defaultImage
      return {
        locale: isEn ? 'en' : 'pt-BR',
        title: `${post.title} – ${siteName}`,
        description: post.excerpt || '',
        url: postUrl,
        image: coverImage,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt || '',
          image: coverImage,
          datePublished: post.date,
          url: postUrl,
          author: { '@type': 'Person', name: post.author || siteName },
        },
      }
    }
  }

  // --- TIL entries ---
  const tilMatch = route.match(/^\/til\/(.+)/)
  if (tilMatch) {
    const slug = tilMatch[1]
    const entry = tilEntries.find((e) => e.slug === slug)
    if (entry) {
      const entryUrl = `${siteUrl}/til/${slug}`
      return {
        locale: 'pt-BR',
        title: `${entry.title} – ${siteName}`,
        description: entry.excerpt || '',
        url: entryUrl,
        image: defaultImage,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: entry.title,
          description: entry.excerpt || '',
          datePublished: entry.date,
          url: entryUrl,
          author: { '@type': 'Person', name: siteName },
        },
      }
    }
  }

  // --- Static routes ---
  const staticPages = {
    // PT
    '/': {
      locale: 'pt-BR',
      title: defaultTitle,
      description: defaultDescription,
      jsonLd: [personJsonLd, websiteJsonLd],
    },
    '/about': {
      locale: 'pt-BR',
      title: `Sobre – ${siteName}`,
      description: 'Conheça mais sobre Clebson A. Fonseca, engenheiro de software.',
      jsonLd: personJsonLd,
    },
    '/blog': {
      locale: 'pt-BR',
      title: `Blog – ${siteName}`,
      description: 'Artigos sobre engenharia de software, arquitetura, frontend, operação e produto.',
      jsonLd: personJsonLd,
    },
    '/til': {
      locale: 'pt-BR',
      title: `Today I Learned – ${siteName}`,
      description: 'Notas curtas sobre aprendizados técnicos do dia a dia.',
      jsonLd: personJsonLd,
    },
    '/portfolio': {
      locale: 'pt-BR',
      title: `Portfólio – ${siteName}`,
      description: 'Projetos e trabalhos de Clebson A. Fonseca.',
      jsonLd: personJsonLd,
    },
    '/hobbies': {
      locale: 'pt-BR',
      title: `Hobbies – ${siteName}`,
      description: 'Interesses pessoais e hobbies de Clebson A. Fonseca.',
      jsonLd: personJsonLd,
    },
    '/books': {
      locale: 'pt-BR',
      title: `Livros – ${siteName}`,
      description: 'Livros que Clebson A. Fonseca leu ou está lendo.',
      jsonLd: personJsonLd,
    },
    '/privacy-policy': {
      locale: 'pt-BR',
      title: `Política de Privacidade – ${siteName}`,
      description: 'Política de privacidade do site whoisclebs.com.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Política de Privacidade – ${siteName}`,
        description: 'Política de privacidade do site whoisclebs.com.',
      },
    },
    '/terms-of-use': {
      locale: 'pt-BR',
      title: `Termos de Uso – ${siteName}`,
      description: 'Termos de uso do site whoisclebs.com.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Termos de Uso – ${siteName}`,
        description: 'Termos de uso do site whoisclebs.com.',
      },
    },
    '/404': {
      locale: 'pt-BR',
      title: `Página não encontrada – ${siteName}`,
      description: 'A página que você procura não foi encontrada.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Página não encontrada – ${siteName}`,
      },
    },
    // EN
    '/en/': {
      locale: 'en',
      title: `${siteName} – Software engineering without theater`,
      description:
        'Blog and portfolio of Clebson A. Fonseca about software engineering, architecture, payments, frontend, and operations.',
      jsonLd: [personJsonLd, websiteJsonLd],
    },
    '/en/about': {
      locale: 'en',
      title: `About – ${siteName}`,
      description: 'Learn more about Clebson A. Fonseca, software engineer.',
      jsonLd: personJsonLd,
    },
    '/en/blog': {
      locale: 'en',
      title: `Blog – ${siteName}`,
      description: 'Articles about software engineering, architecture, frontend, operations, and product.',
      jsonLd: personJsonLd,
    },
    '/en/portfolio': {
      locale: 'en',
      title: `Portfolio – ${siteName}`,
      description: 'Projects and work by Clebson A. Fonseca.',
      jsonLd: personJsonLd,
    },
    '/en/hobbies': {
      locale: 'en',
      title: `Hobbies – ${siteName}`,
      description: 'Personal interests and hobbies of Clebson A. Fonseca.',
      jsonLd: personJsonLd,
    },
    '/en/books': {
      locale: 'en',
      title: `Books – ${siteName}`,
      description: 'Books Clebson A. Fonseca has read or is reading.',
      jsonLd: personJsonLd,
    },
    '/en/privacy-policy': {
      locale: 'en',
      title: `Privacy Policy – ${siteName}`,
      description: 'Privacy policy for whoisclebs.com.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Privacy Policy – ${siteName}`,
        description: 'Privacy policy for whoisclebs.com.',
      },
    },
    '/en/terms-of-use': {
      locale: 'en',
      title: `Terms of Use – ${siteName}`,
      description: 'Terms of use for whoisclebs.com.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Terms of Use – ${siteName}`,
        description: 'Terms of use for whoisclebs.com.',
      },
    },
  }

  const page = staticPages[route]
  if (page) {
    const canonical = route === '/' ? `${siteUrl}/` : `${siteUrl}${route}`
    return {
      ...page,
      url: canonical,
      image: defaultImage,
      type: 'website',
    }
  }

  // Fallback (should not be reached)
  return {
    locale: 'pt-BR',
    title: defaultTitle,
    description: defaultDescription,
    url: `${siteUrl}${route}`,
    image: defaultImage,
    type: 'website',
    jsonLd: personJsonLd,
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  // 1. Read content frontmatter for route enumeration
  const ptPosts = getPublishedPosts('src/content/posts', false)
  const enPosts = getPublishedPosts('src/content/posts', true)
  const tilEntries = getPublishedTilEntries('src/content/til')

  // 2. Build the route list
  const ptStatic = ['/', '/about', '/blog', '/til', '/portfolio', '/hobbies', '/books', '/privacy-policy', '/terms-of-use', '/404']
  const ptBlog = ptPosts.map((p) => `/blog/${p.slug}`)
  const ptTil = tilEntries.map((e) => `/til/${e.slug}`)
  const enStatic = ['/en/', '/en/about', '/en/blog', '/en/portfolio', '/en/hobbies', '/en/books', '/en/privacy-policy', '/en/terms-of-use']
  const enBlog = enPosts.map((p) => `/en/blog/${p.slug}`)

  const routes = [...ptStatic, ...ptBlog, ...ptTil, ...enStatic, ...enBlog]
  console.log(`Prerendering ${routes.length} routes …\n`)

  // 3. Read the built template
  const templatePath = join(distDir, 'index.html')
  let template
  try {
    template = readFileSync(templatePath, 'utf8')
  } catch {
    console.error('dist/index.html not found. Run `vite build` first.')
    process.exit(1)
  }

  // 4. Start Vite in SSR mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  })

  // 5. Load the SSR entry
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')

  // 6. Prerender each route
  for (const route of routes) {
    const seo = getSeoForRoute(route, ptPosts, enPosts, tilEntries)

    // Render the React tree to static markup
    const appHtml = render(route)

    // Inject into template
    let html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

    // Compute hreflang alternate links for pages with a counterpart in the
    // other language
    const hreflangLinks = getHreflangLinks(route, ptPosts, enPosts)

    // Inject SEO meta/JSON-LD and fix <html lang>
    html = injectSeoTags(html, seo, hreflangLinks)

    // Write to dist/<rota>/index.html
    // Normalize / → /index.html, /about → /about/index.html, etc.
    const normalized = route === '/' ? '' : route
    const outPath = join(distDir, normalized, 'index.html')
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, html)

    console.log(`  ✓ ${route}`)
  }

  await vite.close()

  // ── Sitemap ──────────────────────────────────────────────────────────
  const dateByRoute = {}
  for (const p of ptPosts) {
    if (p.date) dateByRoute[`/blog/${p.slug}`] = p.date
  }
  for (const p of enPosts) {
    if (p.date) dateByRoute[`/en/blog/${p.slug}`] = p.date
  }
  for (const e of tilEntries) {
    if (e.date) dateByRoute[`/til/${e.slug}`] = e.date
  }

  const today = new Date().toISOString().split('T')[0]
  const routeSet = new Set(routes)

  const sitemapUrls = routes
    .filter((r) => r !== '/404')
    .map((route) => {
      // Normalize trailing slash: routes already ending in '/' keep it as-is
      const normalizeUrl = (p) => `${siteUrl}${p.endsWith('/') ? p : p + '/'}`
      const loc = normalizeUrl(route)
      const lastmod = dateByRoute[route] || today

      // Determine hreflang alternates (where both language versions exist)
      const isEn = route.startsWith('/en')
      const ptRoute = route === '/en/' ? '/' : isEn ? route.slice(3) : route
      const enRoute = route === '/' ? '/en/' : isEn ? route : '/en' + route
      const hasBoth = routeSet.has(ptRoute) && routeSet.has(enRoute) && ptRoute !== enRoute

      const alternates = hasBoth
        ? `
    <xhtml:link rel="alternate" hreflang="pt-BR" href="${normalizeUrl(ptRoute)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${normalizeUrl(enRoute)}"/>`
        : ''

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>${alternates}
  </url>`
    })
    .join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapUrls}
</urlset>`

  writeFileSync('dist/sitemap.xml', sitemap)
  console.log('  ✓ dist/sitemap.xml')

  console.log(`\nPrerender complete — ${routes.length} routes, ${routes.length - 1} sitemap URLs.`)
}

main().catch((err) => {
  console.error('\nPrerender failed:', err)
  process.exit(1)
})
