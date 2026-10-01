/**
 * scripts/verify-case-snippets.mjs
 *
 * Confere cada trecho de código dos cases contra o arquivo real no GitHub, na revisão fixada no
 * permalink (raw.githubusercontent.com/<owner>/<repo>/<sha>/<arquivo>), linha a linha.
 * Usa a rede, por isso fica fora do build; rode ao escrever ou revisar um case.
 *
 * Uso: node scripts/verify-case-snippets.mjs   (Node ≥ 22.18: importa TypeScript por type stripping)
 */
import { caseStudies } from '../src/lib/content/cases/index.ts'

const BLOB_RE = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/blob\/([0-9a-f]{40})\/([\w./-]+)#L(\d+)(?:-L(\d+))?$/
let failed = 0

for (const study of caseStudies) {
  for (const snippet of study.snippets) {
    const [, owner, repo, sha, file, start, end] = BLOB_RE.exec(snippet.url) ?? []
    const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${file}`
    const response = await fetch(raw)
    if (!response.ok) {
      failed += 1
      console.error(`✗ ${study.slug} ${snippet.file}: HTTP ${response.status} em ${raw}`)
      continue
    }
    const lines = (await response.text()).split('\n').slice(Number(start) - 1, Number(end ?? start)).join('\n')
    if (lines === snippet.code) {
      console.log(`✓ ${study.slug} ${snippet.file}#L${start}-L${end ?? start}`)
    } else {
      failed += 1
      console.error(`✗ ${study.slug} ${snippet.file}#L${start}-L${end ?? start} difere do GitHub`)
    }
  }
}

process.exit(failed ? 1 : 0)
