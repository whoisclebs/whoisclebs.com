/**
 * Limite de requisições em janela fixa, em memória. No Workers cada isolate tem o seu mapa e a Cloudflare
 * distribui requisições entre isolates e data centers: é um freio best-effort contra abuso trivial, não uma
 * cota global. As chaves são opacas (o chamador decide; o mapa nunca é logado) e a memória é limitada.
 */
export interface RateLimitDecision {
  allowed: boolean
  retryAfterSeconds?: number
}

export interface FixedWindowLimiter {
  take(key: string): RateLimitDecision
  size(): number
}

export interface FixedWindowOptions {
  limit: number
  windowMs: number
  /** Teto de chaves guardadas; ao atingi-lo, a mais antiga sai. */
  maxKeys?: number
  now?: () => number
}

export function createFixedWindowLimiter({ limit, windowMs, maxKeys = 5_000, now = Date.now }: FixedWindowOptions): FixedWindowLimiter {
  const windows = new Map<string, { start: number; count: number }>()

  function prune(at: number): void {
    for (const [key, window] of windows) if (at - window.start >= windowMs) windows.delete(key)
  }

  return {
    take(key) {
      const at = now()
      let window = windows.get(key)
      if (window && at - window.start >= windowMs) {
        windows.delete(key)
        window = undefined
      }
      if (!window) {
        if (windows.size >= maxKeys) prune(at)
        if (windows.size >= maxKeys) {
          const oldest = windows.keys().next().value
          if (oldest !== undefined) windows.delete(oldest)
        }
        windows.set(key, { start: at, count: 1 })
        return { allowed: true }
      }
      if (window.count < limit) {
        window.count += 1
        return { allowed: true }
      }
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((window.start + windowMs - at) / 1000)) }
    },
    size: () => windows.size,
  }
}
