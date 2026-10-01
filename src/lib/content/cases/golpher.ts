/**
 * Case golpher, em primeira pessoa. Cada afirmação foi conferida em 2026-10-01 num clone da revisão
 * 815b8d7 (merge da v0.1.0, último commit de `main`) e na issue #22. O porquê das decisões vem do
 * documento de design da v0.1.0, que está no próprio repositório.
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
const commit = (sha: string) => `${REPO}/commit/${sha}`

const ENV = 'Go 1.26.4 linux/amd64, WSL2, clone da revisão 815b8d7'

export const golpherCase: CaseStudyInput = {
  slug: 'golpher',
  title: 'golpher: um microframework HTTP em Go sobre o net/http',
  dek: 'Comecei o golpher em março de 2025, com outro nome, e publiquei a v0.1.0 em julho de 2026. Ele tem rotas e middleware no estilo Express e Fiber, e a aplicação continua sendo um http.Handler.',
  checkedAt: '2026-10-01',
  revision: { sha: SHA, date: '2026-07-20', url: commit(SHA) },
  sections: [
    {
      id: 'de-onde-veio',
      title: 'De onde veio',
      body: [
        `O primeiro commit, de 16 de março de 2025, cria uma biblioteca chamada rush. Em 27 de abril de 2026 troquei o nome para golpher ([d6578ae](${commit('d6578ae8a3c073d5d5c240d693bcb07d72a0f2ef')})) e, no mesmo dia, entrou a API montada sobre o \`net/http\`.`,
        `Usei o golpher na API do meepledecks, outro projeto meu, que rodava em Fiber. Anotei o que faltou em [\`docs/meepledecks-integration-gaps.md\`](${at('docs/meepledecks-integration-gaps.md')}): middleware por prefixo, grupos aninhados, o padrão da rota casada para as métricas e middleware pronto de request ID, log e CORS. Durante a integração entrou só o \`Request.SetContext\`. O resto continua na lista de próximos passos do [ROADMAP](${at('ROADMAP.md', 25, 35)}).`,
        `O [README](${at('README.md', 13, 14)}) avisa que ainda não há versão estável e manda quem precisa de produção hoje usar Fiber, Gin ou o \`net/http\` direto.`,
      ],
    },
    {
      id: 'a-regra',
      title: 'A regra',
      body: [
        `\`*golpher.App\` implementa \`http.Handler\`. No [\`docs/principles.md\`](${at('docs/principles.md', 5, 21)}) deixei escrito que todo recurso novo precisa continuar funcionando com \`http.Server\`, \`http.ResponseWriter\`, \`*http.Request\`, cancelamento por \`context.Context\` e o middleware padrão do Go.`,
        `No mesmo arquivo ficou o que [não entra](${at('docs/principles.md', 31, 36)}): servidor HTTP próprio, banco, autenticação, templates e HTTP/3 no núcleo. O [\`go.mod\`](${at('go.mod')}) não tem nenhum \`require\`.`,
      ],
    },
    {
      id: 'o-que-a-v010-consertou',
      title: 'O que a v0.1.0 consertou',
      body: [
        `Antes da v0.1.0 escrevi um [documento de design](${at(DESIGN, 1, 12)}) com os problemas do protótipo. O registro de rotas e middleware mexia em mapas compartilhados sem sincronização enquanto \`ServeHTTP\` lia os mesmos mapas, uma condição de corrida assim que o servidor subia. O handler de erro padrão mandava \`err.Error()\` para o cliente, o body era lido inteiro de uma vez, conviviam quatro assinaturas de handler e \`Listen\` chamava \`log.Fatal\`.`,
        `Agora o registro passa por um mutex e o [primeiro \`ServeHTTP\` congela a aplicação](${at('golpher.go', 128, 143)}). Depois disso cada requisição só lê um \`atomic.Bool\`, e registrar rota dá \`panic\`. Um \`sync.RWMutex\` em toda requisição também resolveria a corrida, mas eu pagaria a trava em cada request e ainda daria para registrar rota com o servidor no ar. Está no design, na [decisão D2](${at(DESIGN, 59, 65)}).`,
        `Erro que não é \`ErrorGolpher\` vira um 500 genérico. A causa original vai para o \`ErrorObserver\`, uma vez só, e [nada é renderizado se a resposta já começou](${at('error.go', 52, 61)}).`,
        `O body tem [limite padrão de 1 MiB](${at('golpher.go', 77, 80)}), aplicado com \`http.MaxBytesReader\` só na primeira leitura. Ler tudo antes, como o protótipo fazia, quebrava handler de streaming e cobrava a leitura de toda requisição ([D7](${at(DESIGN, 151)})).`,
        `Sobrou uma assinatura de handler, [\`func(*Request, *Response) error\`](${at('context.go', 7)}). O método HTTP é validado pela sintaxe de token da RFC 9110, sem lista fechada, para não bloquear métodos de extensão ([D8](${at(DESIGN, 171)})). E entrou o método \`QUERY\` da RFC 10008, com [constante própria](${at('golpher.go', 11, 13)}) porque o \`net/http\` do Go 1.23.6 não tem uma. A lista do que quebrou para quem usava a versão anterior está no [README](${at('README.md', 226, 244)}).`,
      ],
    },
    {
      id: 'como-uma-requisicao-passa',
      title: 'Como uma requisição passa',
      body: [
        `\`App.ServeHTTP\` congela a aplicação e entrega ao roteador. [Rotas estáticas](${at('router.go', 218, 223)}) ficam num mapa de método e caminho e têm prioridade; [rotas com parâmetro](${at('router.go', 225, 235)}) ficam numa árvore de segmentos. \`Request\` e \`Response\` voltam para um \`sync.Pool\` no fim de cada requisição ([\`docs/performance.md\`](${at('docs/performance.md')})).`,
      ],
      figures: ['architecture'],
    },
    {
      id: 'onde-ainda-falha',
      title: 'Onde ainda falha',
      body: [
        `404 e 405 não passam pelo middleware global. O roteador [chama \`reportError\` direto](${at('router.go', 237, 246)}), então log, autenticação e métricas registrados com \`app.Use\` não veem essas respostas. Isso contraria uma [regra do meu próprio \`principles.md\`](${at('docs/principles.md', 53)}). Abri a [issue #22](${REPO}/issues/22) com a correção: tratar 404 e 405 como rotas internas e criar os ganchos \`app.NotFound\` e \`app.MethodNotAllowed\`. Ela continua aberta.`,
        `O [\`docs/router-design.md\`](${at('docs/router-design.md', 35, 45)}) ainda descreve três estilos de handler, inclusive com \`*Ctx\`, que a v0.1.0 removeu.`,
        `Não tenho benchmark publicado. O \`docs/performance.md\` lista as decisões do caminho quente sem números, e "benchmarks contra Gin, Fiber, Chi e Zinc" continua nos próximos passos do [ROADMAP](${at('ROADMAP.md', 34)}).`,
      ],
    },
    {
      id: 'testes',
      title: 'Testes',
      body: [
        `São 140 funções de teste em dois arquivos. O GitHub Actions roda [CI, lint, cobertura, CodeQL e govulncheck](${REPO}/tree/${SHA}/.github/workflows).`,
      ],
      figures: ['measurements'],
    },
    {
      id: 'trechos',
      title: 'Trechos',
      body: [],
      figures: ['snippets'],
    },
  ],
  architecture: {
    caption: 'Caminho de uma requisição no golpher v0.1.0. A célula tracejada é o 404 e o 405 fora do middleware global, da issue #22.',
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
      caption: 'Depois do primeiro `ServeHTTP`, cada requisição só lê um `atomic.Bool`.',
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
      caption: 'As linhas 237–246 chamam `reportError` direto. É o problema da issue #22.',
    },
    {
      title: 'Limite de body na primeira leitura',
      file: 'request.go',
      lines: [119, 140],
      lang: 'go',
      url: at('request.go', 119, 140),
      code: golpherLazyBody,
      caption: '`http.MaxBytesReader` só entra na primeira leitura do body.',
    },
  ],
  measurements: [
    { command: 'go test -race -count=1 ./...', environment: ENV, date: '2026-10-01', result: 'passou, com o detector de corrida ligado' },
    { command: 'go test -count=1 -cover ./...', environment: ENV, date: '2026-10-01', result: '92,4% de cobertura de instruções' },
    { command: 'go vet ./...', environment: ENV, date: '2026-10-01', result: 'nenhum aviso' },
  ],
}
