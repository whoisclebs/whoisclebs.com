// Tipos globais do SvelteKit. Os bindings do Worker são descritos por `ActivityEnv` (composition root).
import type { ActivityEnv } from '$lib/server/compose'

declare global {
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
