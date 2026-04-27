import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const appShell = 'dist/index.html'

function parseSlug(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null

  const slugLine = match[1].split(/\r?\n/).find((line) => line.startsWith('slug:'))
  return slugLine?.slice('slug:'.length).trim() ?? null
}

function copyAppShell(route) {
  const outputPath = join('dist', route, 'index.html')
  mkdirSync(dirname(outputPath), { recursive: true })
  copyFileSync(appShell, outputPath)
}

function markdownSlugs(directory) {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseSlug(readFileSync(join(directory, file), 'utf8')))
    .filter(Boolean)
}

copyFileSync(appShell, 'dist/404.html')

const staticRoutes = ['about', 'books', 'portfolio', 'hobbies', 'blog', 'til']
for (const route of staticRoutes) copyAppShell(route)

for (const slug of markdownSlugs('src/content/posts')) copyAppShell(join('blog', slug))
for (const slug of markdownSlugs('src/content/til')) copyAppShell(join('til', slug))
