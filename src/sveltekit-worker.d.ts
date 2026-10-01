// Módulo virtual resolvido pelo `alias` do wrangler.jsonc para o Worker gerado pelo adapter-cloudflare.
declare module 'sveltekit-worker' {
  const worker: {
    fetch(request: Request, env: unknown, ctx: unknown): Promise<Response>
  }
  export default worker
}
