import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const distDir = 'dist'
const htmlPath = join(distDir, 'index.html')
const stylesheetPattern = /<link rel="stylesheet" crossorigin href="(?<href>\/assets\/[^".]+\.css)">/

const html = await readFile(htmlPath, 'utf8')
const match = html.match(stylesheetPattern)

if (!match?.groups?.href) {
  console.warn('Skipping CSS inlining: stylesheet link not found')
} else {
  const cssPath = join(distDir, match.groups.href.replace(/^\//, ''))
  const css = await readFile(cssPath, 'utf8')
  const inlinedHtml = html.replace(match[0], `<style>${css}</style>`)
  await writeFile(htmlPath, inlinedHtml)
  console.log(`Inlined ${match.groups.href} into index.html`)
}
