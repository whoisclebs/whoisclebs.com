import { useEffect } from 'react'

type SeoProps = {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  jsonLd?: Record<string, unknown>
}

const siteUrl = 'https://whoisclebs.com'
const defaultTitle = 'whoisclebs.com — Engenharia de software sem teatro'
const defaultDescription = 'Blog e portfolio de Clebson A. Fonseca sobre engenharia de software, arquitetura, pagamentos, frontend e operação.'
const defaultImage = '/profile/clebson.png'

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null

  if (!element) {
    element = selector.startsWith('link') ? document.createElement('link') : document.createElement('meta')
    document.head.appendChild(element)
  }

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value)
  }
}

export function SEO({ title, description, path = '/', image = defaultImage, type = 'website', jsonLd }: SeoProps) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} — whoisclebs.com` : defaultTitle
    const resolvedDescription = description ?? defaultDescription
    const canonical = `${siteUrl}${path}`
    const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`

    document.title = resolvedTitle
    upsertMeta('meta[name="description"]', { name: 'description', content: resolvedDescription })
    upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: resolvedTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: resolvedDescription })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: resolvedTitle })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: resolvedDescription })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl })

    let script = document.head.querySelector('#jsonld') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = 'jsonld'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(jsonLd ?? {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Clebson A. Fonseca',
      url: siteUrl,
      image: `${siteUrl}/profile/clebson.png`,
      sameAs: ['https://github.com/whoisclebs', 'https://linkedin.com/in/whoisclebs'],
      jobTitle: 'Software Engineer',
    })
  }, [description, image, jsonLd, path, title, type])

  return null
}
