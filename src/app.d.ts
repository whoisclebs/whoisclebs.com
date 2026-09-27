// Tipos globais do SvelteKit. Os bindings do Worker são descritos por `ActivityEnv` (composition root).
import type { ActivityEnv } from '$lib/server/compose'

declare global {
  /** SHA completo do commit publicado, gravado no build (`vite.config.ts`); vazio se o Git não estiver disponível. */
  const __BUILD_SHA__: string

  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: ActivityEnv
    }
  }
}

export {}
