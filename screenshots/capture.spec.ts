import { mkdirSync } from 'node:fs'
import { test } from '@playwright/test'

const routes = [
  { name: 'home', path: '/' },
  { name: 'blog', path: '/blog' },
  { name: 'post-arquitetura', path: '/blog/arquitetura-de-software-sem-teatro' },
  { name: 'books', path: '/books' },
  { name: 'portfolio', path: '/portfolio' },
]

test.describe('editorial screenshots', () => {
  for (const route of routes) {
    test(`capture ${route.name}`, async ({ page }) => {
      mkdirSync('screenshots/output', { recursive: true })
      await page.goto(route.path)
      await page.screenshot({ path: `screenshots/output/${route.name}.png`, fullPage: true })
    })
  }
})
