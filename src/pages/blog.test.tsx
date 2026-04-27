import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Blog from './blog'
import BlogPost from './blog-post'
import { getPublishedPosts } from '@/lib/posts'

const clipboardWrite = vi.fn()

function renderBlogRoute(initialEntry = '/blog') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('blog editorial pages', () => {
  beforeEach(() => {
    clipboardWrite.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWrite,
      },
    })
  })

  it('renders the first paginated page with pagination controls', () => {
    renderBlogRoute()

    expect(screen.getByRole('heading', { level: 1, name: /engenharia em campo/i })).toBeInTheDocument()
    expect(screen.getByTestId('recent-post-grid')).toHaveClass('md:grid-cols-2')

    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(getPublishedPosts().length)

    for (const post of getPublishedPosts()) {
      const tile = screen.getByTestId(`post-card-${post.slug}`)
      expect(within(tile).getByText(post.kicker)).toBeInTheDocument()
      expect(within(tile).getByRole('link', { name: post.title })).toHaveAttribute('href', `/blog/${post.slug}`)
      expect(within(tile).getByText(post.excerpt)).toBeInTheDocument()
      expect(within(tile).getByText((content) => content.includes(post.readingTime))).toBeInTheDocument()
    }

    expect(screen.getByText(/página 1 de 1/i)).toBeInTheDocument()
    expect(screen.getByText(/próxima página/i)).toBeInTheDocument()
  })

  it('clamps subsequent paginated pages without empty grid gaps', () => {
    renderBlogRoute('/blog?page=2')

    expect(screen.getAllByRole('article')).toHaveLength(getPublishedPosts().length)
    expect(screen.getByTestId('recent-post-grid')).toHaveClass('md:grid-cols-2')
    expect(screen.getByText(/página 1 de 1/i)).toBeInTheDocument()
  })

  it('renders a post route by slug with newsletter CTA and a 720px reading container', () => {
    renderBlogRoute('/blog/arquitetura-de-software-sem-teatro')

    const article = screen.getByRole('article')
    expect(article).toHaveClass('article-container')
    expect(screen.getByRole('heading', { level: 1, name: /Arquitetura de software sem teatro/i })).toBeInTheDocument()
    expect(screen.getByText('ARQUITETURA')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /clebson a. fonseca/i })).toHaveAttribute('src', '/profile/clebson.png')
    expect(screen.getByRole('heading', { name: /Receba notas de engenharia/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
  })

  it('handles newsletter submit without leaving the static page', async () => {
    const user = userEvent.setup()
    renderBlogRoute('/blog/arquitetura-de-software-sem-teatro')

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'dev@example.com')
    await user.click(screen.getByRole('button', { name: /inscrever/i }))

    expect(screen.getByText(/integração da newsletter em breve/i)).toBeInTheDocument()
  })

  it('renders a friendly not found state for an unknown post slug', () => {
    renderBlogRoute('/blog/slug-inexistente')

    expect(screen.getByRole('heading', { name: /artigo não encontrado/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voltar para o blog/i })).toHaveAttribute('href', '/blog')
  })

  it('shows language metadata and copies code block content', async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    })
    renderBlogRoute('/blog/arquitetura-de-software-sem-teatro')

    expect(screen.getByText('typescript')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /copiar código typescript/i }))

    expect(clipboardWrite).toHaveBeenCalledWith(expect.stringContaining('type ArchitectureDecision'))
    expect(await screen.findByText(/copiado/i)).toBeInTheDocument()
  })
})
