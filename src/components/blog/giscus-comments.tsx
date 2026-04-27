import { useEffect, useRef } from 'react'

export function GiscusComments() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || container.dataset.loaded === 'true') return

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-repo', 'whoisclebs/whoisclebs.com')
    script.setAttribute('data-repo-id', 'R_kgDOLkjfCg')
    script.setAttribute('data-category', 'Announcements')
    script.setAttribute('data-category-id', 'DIC_kwDOLkjfCs4CeMff')
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'bottom')
    script.setAttribute('data-theme', 'light')
    script.setAttribute('data-lang', 'pt')
    script.setAttribute('data-loading', 'lazy')

    container.dataset.loaded = 'true'
    container.appendChild(script)
  }, [])

  return (
    <section className="mt-12 border-t border-[#1a1a1a] pt-8" aria-label="Comentários">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.095em] text-[#1a1a1a]">COMENTÁRIOS</p>
      <div ref={containerRef} />
    </section>
  )
}
