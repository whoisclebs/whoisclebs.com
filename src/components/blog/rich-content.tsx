import { CodeBlock } from './code-block'
import type { MarkdownBlock } from '@/lib/markdown'

type RichContentProps = {
  blocks: MarkdownBlock[]
}

export function RichContent({ blocks }: RichContentProps) {
  return (
    <div className="min-w-0 max-w-full break-words font-serif text-lg leading-8 text-[#1a1a1a]">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') return <p key={index} className="mb-6 break-words">{block.text}</p>
        if (block.type === 'heading') {
          return <h2 key={index} className="mb-4 mt-10 break-words font-sans text-3xl font-extrabold leading-tight tracking-[-0.035em]">{block.text}</h2>
        }
        if (block.type === 'list') {
          return (
            <ul key={index} className="mb-6 list-disc pl-6">
              {block.items.map((item) => <li key={item} className="mb-2 break-words">{item}</li>)}
            </ul>
          )
        }
        return <CodeBlock key={index} language={block.language} code={block.code} />
      })}
    </div>
  )
}
