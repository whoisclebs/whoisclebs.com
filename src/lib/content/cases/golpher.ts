/**
 * Case golpher. Fontes conferidas em 2026-09-27 num clone da revisão 815b8d7 (merge da v0.1.0, último
 * commit de `main`) e na API pública do GitHub. As alternativas recusadas estão escritas no documento de
 * design do próprio repositório; "O que eu mudaria" é análise minha, rotulada.
 */
import type { CaseStudyInput } from '../case-schema.ts'
import { golpherFreeze, golpherLazyBody, golpherReportError, golpherRouter } from './snippets.ts'

const REPO = 'https://github.com/go-golpher/golpher'
const SHA = '815b8d7fc393f9f6d3b24f602b609a17edfb3433'
const DESIGN = 'openspec/changes/archive/2026-07-19-harden-production-foundations-and-query/design.md'
const at = (file: string, from?: number, to?: number) => {
  const plain = file.endsWith('.md') && from ? '?plain=1' : ''
  return `${REPO}/blob/${SHA}/${file}${plain}${from ? `#L${from}${to && to !== from ? `-L${to}` : ''}` : ''}`
}
const src = (label: string, file: string, from?: number, to?: number) => ({ label, url: at(file, from, to) })

const readme = src('README.md', 'README.md')
const release = { label: 'Release v0.1.0 (20 jul. 2026)', url: `${REPO}/releases/tag/v0.1.0` }
const issue22 = { label: 'Issue #22 (aberta)', url: `${REPO}/issues/22` }
const tree = { label: `Árvore da revisão ${SHA.slice(0, 7)}`, url: `${REPO}/tree/${SHA}` }
const workflows = { label: '.github/workflows', url: `${REPO}/tree/${SHA}/.github/workflows` }

export const golpherCase: CaseStudyInput = {
  slug: 'golpher',
  title: 'golpher: um microframework que não esconde o net/http',
  dek: 'Roteamento e middleware no estilo Express e Fiber, e a aplicação continua sendo um http.Handler. O case segue a v0.1.0 e as decisões que o próprio repositório registra.',
  question: 'Como dar ergonomia de framework a uma API em Go sem abandonar o http.Handler?',
  checkedAt: '2026-09-27',
  revision: { sha: SHA, date: '2026-07-20', url: `${REPO}/commit/${SHA}` },
  sections: [
    {
      id: 'contexto',
      voice: 'fonte',
      body: [
        'O golpher existe desde março de 2025 e chegou à v0.1.0 em 20 de julho de 2026. O README avisa que ainda não há versão estável e recomenda Fiber, Gin ou o `net/http` direto para produção hoje.',
        'O documento de design da v0.1.0 descreve o ponto de partida. No protótipo, o registro de rotas e middleware alterava mapas compartilhados sem sincronização enquanto `ServeHTTP` os lia (uma condição de corrida assim que o servidor subia), o handler de erro padrão devolvia `err.Error()` ao cliente, o body era lido inteiro de uma vez e `Listen` chamava `log.Fatal`.',
      ],
      sources: [readme, release, src('design.md, linhas 1–12', DESIGN, 1, 12)],
    },
    {
      id: 'restricoes',
      voice: 'fonte',
      body: [
        'A restrição principal está no `docs/principles.md`: `*golpher.App` implementa `http.Handler`, e todo recurso novo precisa continuar compatível com `http.Server`, `http.ResponseWriter`, `*http.Request`, cancelamento por `context.Context` e o middleware padrão do Go.',
        'Os não-objetivos estão escritos: nenhum runtime HTTP próprio, nenhuma camada de banco, autenticação ou templates, e nada de HTTP/3 no núcleo.',
        'Para a v0.1.0, o design fixa o Go 1.23.6 e proíbe módulos de terceiros. O `go.mod` não tem nenhum `require`.',
      ],
      sources: [src('principles.md, linhas 5–36', 'docs/principles.md', 5, 36), src('design.md, linhas 28–35', DESIGN, 28, 35), src('go.mod', 'go.mod')],
    },
    {
      id: 'decisao',
      voice: 'fonte',
      body: [
        'Congelar a aplicação no primeiro request. O registro de rotas e middleware passa por um mutex; o primeiro `ServeHTTP` marca a aplicação como congelada e, dali em diante, nenhuma requisição pega trava. Registrar rota depois disso gera `panic`.',
        'Mascarar erro desconhecido e observá-lo uma vez. Um `ErrorGolpher` vira status e mensagem para o cliente; qualquer outro erro vira um 500 genérico. A causa original vai só para o `ErrorObserver`, chamado exatamente uma vez, e nada é renderizado se a resposta já começou a ser escrita.',
        'Limitar o body sem lê-lo antes da hora. O limite padrão é 1 MiB, aplicado com `http.MaxBytesReader` só na primeira leitura.',
      ],
      sources: [
        src('design.md, D2 (linhas 59–65)', DESIGN, 59, 65),
        src('golpher.go, linhas 128–143', 'golpher.go', 128, 143),
        src('design.md, D4 (linhas 94–110)', DESIGN, 94, 110),
        src('error.go, linhas 34–61', 'error.go', 34, 61),
        src('design.md, D7 (linhas 130–151)', DESIGN, 130, 151),
        src('golpher.go, linhas 77–80', 'golpher.go', 77, 80),
      ],
    },
    {
      id: 'arquitetura',
      voice: 'fonte',
      body: [
        'O ciclo de vida de uma requisição, como o `principles.md` descreve e o `router.go` implementa. Rotas estáticas ficam num mapa método → caminho e têm prioridade; rotas com parâmetros ficam numa árvore de segmentos. `Request` e `Response` são reaproveitados com `sync.Pool`.',
      ],
      sources: [src('principles.md, linhas 38–46', 'docs/principles.md', 38, 46), src('router.go, linhas 214–246', 'router.go', 214, 246), src('performance.md', 'docs/performance.md')],
    },
    {
      id: 'alternativas',
      voice: 'fonte',
      body: [
        'Estas recusas estão escritas no documento de design, cada uma com o motivo.',
        '`sync.RWMutex` em todo registro e em todo `ServeHTTP`: correto, mas com disputa de trava no caminho de cada requisição e ainda permitindo registrar rota com o servidor no ar. Ficou o congelamento.',
        'Getters que copiam a configuração: mais API e ainda deixam ver mutações no meio do caminho.',
        'Chamar o observador depois do handler de erro: perderia os erros que acontecem depois de a resposta começar a ser escrita.',
        'Ler o body inteiro de antemão, como fazia o protótipo: quebra handlers de streaming e cobra a leitura de toda requisição.',
        'Uma lista fechada de métodos HTTP: mais simples, mas bloquearia métodos de extensão. A validação segue a sintaxe de token da RFC 9110.',
      ],
      sources: [
        src('design.md, D1 (linha 57)', DESIGN, 57),
        src('design.md, D2 (linha 65)', DESIGN, 65),
        src('design.md, D4 (linha 110)', DESIGN, 110),
        src('design.md, D7 (linha 151)', DESIGN, 151),
        src('design.md, D8 (linha 171)', DESIGN, 171),
      ],
    },
    {
      id: 'resultado',
      voice: 'fonte',
      body: [
        'A v0.1.0 saiu em 20 de julho de 2026 com as quebras de compatibilidade listadas no README (assinatura única de handler, `Listen` devolvendo erro, limite de body por padrão).',
        'Rodei a suíte na revisão 815b8d7: passa também com o detector de corrida (`-race`), com 92,4% de cobertura de instruções. É medição minha, no ambiente da tabela; o projeto não publica esse número.',
        'O repositório tem workflows de CI, lint, cobertura, CodeQL e govulncheck.',
        'Não há benchmark publicado: o ROADMAP ainda lista benchmarks contra Gin, Fiber, Chi e Zinc como próximo passo, e o `docs/performance.md` descreve decisões de caminho quente, sem medições.',
      ],
      sources: [release, src('README.md, linhas 226–244', 'README.md', 226, 244), tree, workflows, src('ROADMAP.md, linha 34', 'ROADMAP.md', 34), src('performance.md', 'docs/performance.md')],
    },
    {
      id: 'mudaria',
      voice: 'analise',
      body: [
        'Faria 404 e 405 passarem pelo middleware global. Hoje o roteador responde direto, então logging, autenticação e métricas registrados com `app.Use` não veem essas respostas, o que contradiz a própria regra do `principles.md`. Está registrado na issue #22, aberta.',
        'Atualizaria o `docs/router-design.md`. Ele ainda descreve três estilos de handler, inclusive com `*Ctx`, que a v0.1.0 removeu em favor de uma assinatura única.',
        'Publicaria benchmarks reproduzíveis antes de qualquer afirmação de desempenho, que é o que o próprio ROADMAP já pede.',
      ],
      sources: [
        issue22,
        src('router.go, linhas 237–246', 'router.go', 237, 246),
        src('principles.md, linha 53', 'docs/principles.md', 53),
        src('router-design.md, linhas 35–45', 'docs/router-design.md', 35, 45),
        src('context.go, linha 7', 'context.go', 7),
        src('ROADMAP.md, linha 34', 'ROADMAP.md', 34),
      ],
    },
    {
      id: 'codigo',
      voice: 'fonte',
      body: ['Os trechos abaixo são da revisão 815b8d7, cada um com link para o arquivo e as linhas exatas no GitHub.'],
      sources: [tree],
    },
  ],
  architecture: {
    caption: 'Caminho de uma requisição no golpher v0.1.0. Célula tracejada: lacuna conhecida, registrada em issue aberta.',
    nodes: [
      { label: 'App.ServeHTTP', detail: 'Congela a aplicação na primeira chamada e delega ao roteador.', state: 'solid', source: src('golpher.go:128–134', 'golpher.go', 128, 134) },
      { label: 'Rota estática', detail: 'Mapa método → caminho → índice; tem prioridade sobre parâmetros.', state: 'solid', source: src('router.go:218–223', 'router.go', 218, 223) },
      { label: 'Árvore de segmentos', detail: ':param e *wildcard, casados por especificidade.', state: 'solid', source: src('router.go:225–235', 'router.go', 225, 235) },
      { label: 'Middleware', detail: 'Global, de grupo e de rota; a cadeia é pré-compilada no registro.', state: 'solid', source: src('performance.md', 'docs/performance.md') },
      { label: 'HandlerFunc', detail: 'func(*Request, *Response) error: uma assinatura só.', state: 'solid', source: src('context.go:7', 'context.go', 7) },
      { label: 'reportError', detail: 'O observador recebe a causa original uma vez; 500 genérico se nada foi escrito.', state: 'solid', source: src('error.go:52–61', 'error.go', 52, 61) },
      { label: '404 e 405', detail: 'Respondidos direto pelo roteador, sem passar pelo middleware global (issue #22).', state: 'gap', source: src('router.go:237–246', 'router.go', 237, 246) },
    ],
  },
  snippets: [
    {
      title: 'Congelar no primeiro request',
      file: 'golpher.go',
      lines: [128, 143],
      lang: 'go',
      url: at('golpher.go', 128, 143),
      code: golpherFreeze,
      caption: 'Depois do primeiro `ServeHTTP`, o caminho de cada requisição só lê um `atomic.Bool`.',
    },
    {
      title: 'Observar uma vez, renderizar só se nada foi escrito',
      file: 'error.go',
      lines: [52, 61],
      lang: 'go',
      url: at('error.go', 52, 61),
      code: golpherReportError,
      caption: 'O observador vê a causa original; o cliente só recebe resposta se ela ainda não começou.',
    },
    {
      title: 'Estático primeiro; 404 e 405 fora do middleware',
      file: 'router.go',
      lines: [214, 246],
      lang: 'go',
      url: at('router.go', 214, 246),
      code: golpherRouter,
      caption: 'As linhas 237–246 chamam `reportError` direto: é a lacuna da issue #22.',
    },
    {
      title: 'Limite de body preguiçoso',
      file: 'request.go',
      lines: [119, 140],
      lang: 'go',
      url: at('request.go', 119, 140),
      code: golpherLazyBody,
      caption: '`http.MaxBytesReader` só entra na primeira leitura do body.',
    },
  ],
  measurements: [
    {
      what: 'Suíte com detector de corrida',
      command: 'go test -race -count=1 ./...',
      environment: 'Go 1.26.4 linux/amd64, WSL2 (Linux 6.18), clone da revisão 815b8d7',
      date: '2026-09-27',
      result: 'ok (140 funções de teste)',
      source: tree,
    },
    {
      what: 'Cobertura de instruções',
      command: 'go test -count=1 -cover ./...',
      environment: 'Go 1.26.4 linux/amd64, WSL2 (Linux 6.18), clone da revisão 815b8d7',
      date: '2026-09-27',
      result: '92,4%',
      source: tree,
    },
  ],
}
