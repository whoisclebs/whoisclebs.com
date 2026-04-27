import { describe, expect, it } from 'vitest'
import { getAuthorByUsername } from '@/content/authors'
import { BLOG_POSTS_PER_PAGE, getBalancedEditorialGridItemClass, getPostBySlug, getPublishedPosts, getResponsiveGridClass, paginatePosts } from './posts'

describe('blog content repository', () => {
  it('returns published posts ordered by newest date first with editorial metadata', () => {
    const posts = getPublishedPosts()

    expect(posts.length).toBeGreaterThanOrEqual(3)
    expect(posts.map((post) => post.published)).not.toContain(false)
    expect(posts[0].date >= posts[1].date).toBe(true)
    expect(posts[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        sourcePath: expect.stringMatching(/\.md$/),
        title: expect.any(String),
        author: 'whoisclebs',
        kicker: expect.stringMatching(/^[A-Z0-9 ÁÀÂÃÉÊÍÓÔÕÚÇ/-]+$/),
        excerpt: expect.any(String),
        readingTime: expect.any(String),
      }),
    )
  })

  it('resolves a post by slug and returns undefined for unknown slugs', () => {
    expect(getPostBySlug('arquitetura-de-software-sem-teatro')?.title).toMatch(/Arquitetura/)
    expect(getPostBySlug('slug-inexistente')).toBeUndefined()
  })

  it('maps post authors by username with profile photo', () => {
    const author = getAuthorByUsername('whoisclebs')

    expect(author).toEqual(
      expect.objectContaining({
        username: 'whoisclebs',
        name: 'Clebson A. Fonseca',
        avatar: '/profile/clebson.png',
      }),
    )
  })

  it('chooses grid columns based on the amount of posts to avoid empty gaps', () => {
    expect(getResponsiveGridClass(0)).toBe('md:grid-cols-1')
    expect(getResponsiveGridClass(1)).toBe('md:grid-cols-1')
    expect(getResponsiveGridClass(2)).toBe('md:grid-cols-2')
    expect(getResponsiveGridClass(3)).toBe('md:grid-cols-3')
    expect(getResponsiveGridClass(8)).toBe('md:grid-cols-3')
  })

  it('balances editorial grid items by row remainder', () => {
    expect(getBalancedEditorialGridItemClass(0, 1)).toBe('md:col-span-6')
    expect(getBalancedEditorialGridItemClass(0, 2)).toBe('md:col-span-3')
    expect(getBalancedEditorialGridItemClass(1, 2)).toBe('md:col-span-3')
    expect(getBalancedEditorialGridItemClass(0, 5)).toBe('md:col-span-2')
    expect(getBalancedEditorialGridItemClass(3, 5)).toBe('md:col-span-3')
    expect(getBalancedEditorialGridItemClass(4, 5)).toBe('md:col-span-3')
  })

  it('paginates posts and clamps invalid page numbers', () => {
    const posts = getPublishedPosts()
    const firstPage = paginatePosts(posts, 1)
    const secondPage = paginatePosts(posts, 2)
    const invalidPage = paginatePosts(posts, 99)

    expect(BLOG_POSTS_PER_PAGE).toBe(10)
    expect(firstPage.items).toEqual(posts.slice(0, BLOG_POSTS_PER_PAGE))
    expect(firstPage.currentPage).toBe(1)
    expect(firstPage.totalPages).toBe(1)
    expect(firstPage.hasNextPage).toBe(false)
    expect(secondPage.items).toEqual(posts)
    expect(secondPage.currentPage).toBe(1)
    expect(secondPage.hasPreviousPage).toBe(false)
    expect(invalidPage.currentPage).toBe(1)
  })
})
