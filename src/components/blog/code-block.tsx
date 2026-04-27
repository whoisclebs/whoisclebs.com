import { useState } from 'react'

type CodeBlockProps = {
  language: string
  code: string
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    await navigator.clipboard?.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <figure className="my-8 border border-[#1a1a1a] bg-[#111111] font-mono text-[#f8f8f2]">
      <figcaption className="flex items-center justify-between border-b border-[#333333] px-3 py-2 text-xs uppercase tracking-[0.08em] text-slate-300">
        <span>{language}</span>
        <button type="button" onClick={copyCode} aria-label={`Copiar código ${language}`} className="bg-transparent text-white transition-colors hover:text-[#057dbc]">
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </figcaption>
      <pre className="m-0 overflow-x-auto p-5 text-sm leading-7"><code>{code}</code></pre>
    </figure>
  )
}
