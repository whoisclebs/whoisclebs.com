import { execSync } from 'node:child_process'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

/**
 * Commit publicado, para o item "build" do HUD da home. Ordem: variável do CI da Cloudflare (Workers Builds),
 * do GitHub Actions, e por fim o Git local. Sem nenhum deles, fica vazio e o HUD mostra "sem dado".
 */
function buildSha(): string {
  const fromEnv = process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA
  if (fromEnv && /^[0-9a-f]{40}$/.test(fromEnv)) return fromEnv
  try {
    const sha = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    return /^[0-9a-f]{40}$/.test(sha) ? sha : ''
  } catch {
    return ''
  }
}

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __BUILD_SHA__: JSON.stringify(buildSha()),
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
})
