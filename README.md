# whoisclebs.com

Site pessoal de Clebson Augusto: engenharia de software, projetos open source e escrita técnica.

## Stack

- **SvelteKit 2 + Svelte 5 + TypeScript estrito**, com `@sveltejs/adapter-cloudflare`.
- Páginas editoriais prerenderizadas; conteúdo tipado com Zod em `src/lib/content/` (Markdown em `src/content/`).
- Deploy previsto em **Cloudflare Workers**. `src/worker.ts` é a entrada do Worker e reaproveita o handler do SvelteKit.
- Publicação para agentes gerada do mesmo conteúdo: JSON-LD, `/resume.json`, `/llms.txt`, `/llms-full.txt`, sitemap, RSS
  e um servidor MCP somente leitura em `/mcp`.

## Comandos

```sh
npm ci
npm run dev                # desenvolvimento (Vite)
npm run build              # valida conteúdo e locales, gera OG e faz o build
npm run preview            # wrangler dev na porta 8787, contra o build

npm run check              # svelte-check + tsc
npm run lint
npm test                   # unitários (Vitest)
npm run test:integration   # D1 local com as migrações
npm run test:e2e           # Playwright (sobe o wrangler dev)
npm run verify             # tudo acima em sequência
```

Checagens extras: `check:contrast` (pares de cor AA), `check:budgets` (peso de JS, fontes e imagens),
`check:island` (ilhas com import dinâmico) e `lhci` (Lighthouse CI).

## Estrutura

```
src/content/            artigos e notas em Markdown
src/lib/content/        schemas e dados (projetos, cases, perfil)
src/lib/pages/          páginas
src/lib/components/     componentes (hero, rodapé, 404, simulador…)
src/lib/server/         domínio, portas, adaptadores, publicação e MCP
src/routes/             rotas do SvelteKit
static/                 assets servidos como estão (marca, mídia, cena do rodapé)
scripts/                build de OG, marca e mídias, validações e checagens
migrations/             SQL do D1
tests/                  e2e (Playwright), integração (D1) e fixtures
```

As URLs do site antigo continuam respondendo por 301 (`src/lib/routing/redirects.ts`), e
`tests/e2e/url-parity.spec.ts` confere o inventário em `tests/fixtures/url-inventory.json`.

## API e D1

Existe um backend de atividade pública do GitHub (`GET /api/activity`, job agendado e tabela no D1), separado em
`domain/` (regras puras), `ports/` (contratos), `infra/` (D1, GitHub, memória) e `compose.ts` (o único arquivo que
lê bindings). O teste `src/lib/server/architecture.test.ts` impede que `domain/` e `ports/` dependam de framework ou
plataforma.

Hoje ele está **desligado**: o endpoint de eventos do GitHub deixou de retornar dados, o site não chama mais a API e o
trigger `crons` saiu do `wrangler.jsonc`. O código e os testes continuam, para religar com outra fonte:

1. Implemente `PublicActivitySource` em `src/lib/server/infra/<fonte>/`.
2. Troque a fonte em `compose.ts`.
3. Volte o `crons` no `wrangler.jsonc`.

Para trocar D1 por outro banco, implemente `PublicActivityRepository` com a mesma semântica coberta pelos testes de
integração (upsert por `external_id`, remoção dos ausentes numa transação) e troque o adaptador em `compose.ts`.

## MCP

`/mcp` fala Streamable HTTP, sem estado e somente leitura. Expõe perfil, projetos, artigos e notas como recursos e a
tool `search_content`. Aceita requisições sem `Origin` ou do próprio domínio.

```sh
claude mcp add --transport http whoisclebs https://whoisclebs.com/mcp        # depois do deploy
claude mcp add --transport http whoisclebs-local http://127.0.0.1:8787/mcp   # com npm run preview
```
