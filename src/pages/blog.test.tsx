import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Blog from './blog'
import BlogPost from './blog-post'
import { BLOG_POSTS_PER_PAGE, getPublishedPosts } from '@/lib/posts'
import { I18nProvider, i18nStorageKey } from '@/lib/i18n'

const clipboardWrite = vi.fn()

function renderBlogRoute(initialEntry = '/blog') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <I18nProvider>
        <Routes>
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('blog editorial pages', () => {
  beforeEach(() => {
    clipboardWrite.mockResolvedValue(undefined)
    window.localStorage.clear()
    window.localStorage.setItem(i18nStorageKey, 'pt-BR')
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
    expect(screen.getByTestId('recent-post-grid')).toHaveClass('md:grid-cols-6')

    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(Math.min(BLOG_POSTS_PER_PAGE, getPublishedPosts().length))

    for (const post of getPublishedPosts().slice(0, BLOG_POSTS_PER_PAGE)) {
      const tile = screen.getByTestId(`post-card-${post.slug}`)
      expect(within(tile).getByText(post.kicker)).toBeInTheDocument()
      expect(within(tile).getByRole('link', { name: post.title })).toHaveAttribute('href', `/blog/${post.slug}`)
      expect(within(tile).getByText(post.excerpt)).toBeInTheDocument()
      expect(within(tile).getByText((content) => content.includes(post.readingTime))).toBeInTheDocument()
    }

    expect(screen.getByText(new RegExp(`página 1 de ${Math.ceil(getPublishedPosts().length / BLOG_POSTS_PER_PAGE)}`, 'i'))).toBeInTheDocument()
    expect(screen.getByText(/próxima página/i)).toBeInTheDocument()
  })

  it('clamps subsequent paginated pages without empty grid gaps', () => {
    renderBlogRoute('/blog?page=2')

    const remainingPosts = getPublishedPosts().slice(BLOG_POSTS_PER_PAGE)
    expect(screen.getAllByRole('article')).toHaveLength(remainingPosts.length)
    if (remainingPosts.length > 1) {
      expect(screen.getByTestId('recent-post-grid')).toHaveClass('md:grid-cols-6')
    } else {
      expect(screen.queryByTestId('recent-post-grid')).not.toBeInTheDocument()
    }
    expect(screen.getByText(new RegExp(`página 2 de ${Math.ceil(getPublishedPosts().length / BLOG_POSTS_PER_PAGE)}`, 'i'))).toBeInTheDocument()
  })

  it('renders a post route by slug with newsletter CTA and a 720px reading container', () => {
    renderBlogRoute('/blog/arquitetura-de-software-sem-teatro')

    const article = screen.getByRole('article')
    expect(article).toHaveClass('article-container')
    expect(screen.getByRole('heading', { level: 1, name: /Arquitetura de software sem teatro/i })).toBeInTheDocument()
    expect(screen.getByText('ARQUITETURA')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /clebson a. fonseca/i })).toHaveAttribute('src', '/profile/clebson.png')
    expect(screen.getByRole('heading', { name: /Receba notas de engenharia/i })).toBeInTheDocument()
    expect(screen.getByTitle(/inscrição na newsletter/i)).toHaveAttribute('src', expect.stringContaining('whoisclebs.substack.com/embed'))
    expect(screen.getByLabelText(/comentários/i)).toBeInTheDocument()
  })

  it('links to the Substack newsletter', async () => {
    renderBlogRoute('/blog/arquitetura-de-software-sem-teatro')

    expect(screen.getByRole('link', { name: /abrir newsletter no substack/i })).toHaveAttribute('href', 'https://whoisclebs.substack.com/?utm_campaign=pub&utm_medium=web')
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
