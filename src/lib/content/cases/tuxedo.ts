/**
 * Case tuxedo. Fontes conferidas em 2026-09-27 num clone da revisão 5fbf678 (último commit de `main`)
 * e na API pública do GitHub. Texto entre crases vira `<code>` na página.
 */
import type { CaseStudyInput } from '../case-schema.ts'
import { tuxedoDoClose, tuxedoExecute, tuxedoRequest } from './snippets.ts'

const REPO = 'https://github.com/whoisclebs/tuxedo'
const SHA = '5fbf678c40f9d0c628a960ea353204c205faf9d7'
const at = (file: string, from?: number, to?: number) =>
  `${REPO}/blob/${SHA}/${file}${from ? `#L${from}${to && to !== from ? `-L${to}` : ''}` : ''}`
const src = (label: string, file: string, from?: number, to?: number) => ({ label, url: at(file, from, to) })

const readme = src('README.md', 'README.md')
const goMod = src('go.mod', 'go.mod')
const history = { label: 'Histórico de commits', url: `${REPO}/commits/main/` }
const releases = { label: 'Pré-versões v0.0.1 e v0.1.0-alpha', url: `${REPO}/releases` }
const renameCommit = { label: 'Commit 1e61dc8 (SetHeader → AddHeader)', url: `${REPO}/commit/1e61dc80465f386356282d5a80420a6576f757bd` }
const tree = { label: `Árvore da revisão ${SHA.slice(0, 7)}`, url: `${REPO}/tree/${SHA}` }

export const tuxedoCase: CaseStudyInput = {
  slug: 'tuxedo',
  title: 'tuxedo: um cliente HTTP encadeável sem nenhuma dependência',
  dek: 'Uma biblioteca pequena em Go que troca o ritual do net/http por uma cadeia de chamadas. O código cabe numa leitura só, e este case faz essa leitura inteira, inclusive das partes que ficaram pela metade.',
  question: 'Dá para encurtar chamadas HTTP em Go sem trazer nenhuma dependência?',
  checkedAt: '2026-09-27',
  revision: { sha: SHA, date: '2025-03-04', url: `${REPO}/commit/${SHA}` },
  sections: [
    {
      id: 'contexto',
      voice: 'fonte',
      body: [
        'O tuxedo foi criado em 3 de março de 2025 e recebeu o último commit no dia seguinte: 13 commits, duas pré-versões (v0.0.1 e v0.1.0-alpha) e licença MIT.',
        'O README descreve a intenção: um cliente HTTP “leve e encadeável” que simplifica o `net/http`, com uma API “inspirada em bibliotecas populares como o Resty”, suporte a headers, body e tracing, e decodificação de JSON embutida.',
        'Não há registro público de usuários nem de uso em produção. Por isso este case trata o tuxedo como estudo de desenho de API, não como produto.',
      ],
      sources: [history, releases, readme],
    },
    {
      id: 'restricoes',
      voice: 'fonte',
      body: [
        'O `go.mod` declara Go 1.23.6 e nenhum `require`: a biblioteca usa só a biblioteca padrão.',
        'Tudo passa por um único `*http.Client`, criado em `NewClient` com um timeout que vale para o cliente inteiro. Não existe timeout nem cancelamento por chamada.',
        'A API pública cabe numa tela: `NewClient`, `R`, `AddHeader`, `SetBody`, `EnableTrace`, os verbos `Get`, `Post`, `Put` e `Delete` e, na resposta, `Json` e `Xml`.',
      ],
      sources: [goMod, src('client.go, linhas 24–28', 'client.go', 24, 28), src('request.go', 'request.go'), src('response.go', 'response.go')],
    },
    {
      id: 'decisao',
      voice: 'fonte',
      body: [
        'A decisão central é o builder encadeável. `client.R()` cria um `Request` com o mapa de headers vazio, cada método de configuração devolve o próprio `*Request` e o verbo (`Get`, `Post`, `Put`, `Delete`) dispara a chamada.',
        'O corpo da resposta é lido inteiro para a memória com `io.ReadAll` e volta junto com status e headers. Decodificar fica para depois, em `res.Json(&alvo)` ou `res.Xml(&alvo)`.',
        'Quando há body e ninguém definiu `Content-Type`, o tuxedo assume `application/json`.',
        'A única decisão de API escrita no histórico está no commit 1e61dc8: renomear `SetHeader` para `AddHeader` “por consistência” e separar `Request` e `Response` em arquivos próprios.',
      ],
      sources: [
        src('request.go, linhas 17–35', 'request.go', 17, 35),
        src('client.go, linhas 49–70', 'client.go', 49, 70),
        src('response.go, linhas 25–38', 'response.go', 25, 38),
        renameCommit,
      ],
    },
    {
      id: 'arquitetura',
      voice: 'fonte',
      body: [
        'Uma chamada atravessa quatro arquivos, o maior com 119 linhas. Não há middleware, pool próprio nem transporte customizado: o `*http.Client` da biblioteca padrão faz todo o trabalho de rede.',
      ],
      sources: [tree, src('client.go', 'client.go')],
    },
    {
      id: 'alternativas',
      voice: 'analise',
      body: [
        'O repositório não explica o que foi recusado. O que dá para afirmar lendo o código:',
        'Depender do próprio Resty, citado no README como inspiração, ficou de fora: o `go.mod` não tem nenhum `require`. O tuxedo reimplementa o formato encadeado em vez de importar a biblioteca.',
        'Usar o `net/http` direto também foi evitado, porque é justamente o boilerplate que o README quer tirar: montar o `http.NewRequest`, aplicar headers um a um, chamar `Do`, fechar o body e ler os bytes. As linhas 41–71 do `client.go` são esse ritual, escrito uma vez só.',
        'Minha leitura da troca: aceitar uma camada a mais entre o código e o `net/http` em troca de chamadas de uma linha e de nenhuma dependência para auditar.',
      ],
      sources: [readme, goMod, src('client.go, linhas 41–71', 'client.go', 41, 71)],
    },
    {
      id: 'resultado',
      voice: 'fonte',
      body: [
        'Em 27 de setembro de 2026 rodei a suíte do repositório na revisão 5fbf678: um teste (`TestGet`), passando, com 62,5% de cobertura de instruções. O `go vet` não apontou nada. Comando e ambiente estão na tabela.',
        'O único teste cobre um GET com header. `Post`, `Put`, `Delete`, `Json` e `Xml` não têm teste.',
        'Não existe benchmark, métrica de uso nem relato de produção, e nada disso é afirmado aqui.',
      ],
      sources: [tree, src('client_test.go, linhas 35–45', 'client_test.go', 35, 45)],
    },
    {
      id: 'mudaria',
      voice: 'analise',
      body: [
        'Trocaria o `log.Fatal` por um erro devolvido. Se fechar o body da resposta falhar, `doClose` chama `log.Fatal` e encerra o processo inteiro. Uma biblioteca não deveria decidir isso pelo programa que a usa.',
        'Cumpriria ou retiraria o tracing. O README promete tracing, mas `EnableTrace` só liga uma flag: o bloco correspondente em `execute` é um `TODO`. Eu implementaria com `net/http/httptrace` ou tiraria o método da API.',
        'Aceitaria `context.Context` por chamada. `execute` usa `http.NewRequest`, não `NewRequestWithContext`; sem contexto, quem chama não consegue cancelar uma requisição específica e depende do timeout global.',
        'Daria ao `AddHeader` a semântica do nome. Hoje ele grava num `map[string]string` e aplica com `Header.Set`: chamar duas vezes com a mesma chave substitui o valor, ao contrário de `http.Header.Add`, que acumula.',
        'Colocaria uma política de nova tentativa com chave de idempotência na frente das chamadas. O tuxedo não repete nada: se `Do` falha, o erro sobe. E repetir um POST sem chave de idempotência pode duplicar o efeito do outro lado. A demonstração abaixo mostra o que eu colocaria ali.',
      ],
      sources: [
        src('utils.go, linhas 8–12', 'utils.go', 8, 12),
        src('client.go, linhas 52–54 (TODO do tracing)', 'client.go', 52, 54),
        src('request.go, linhas 55–58', 'request.go', 55, 58),
        src('client.go, linha 42', 'client.go', 42),
        src('request.go, linhas 32–35', 'request.go', 32, 35),
        src('client.go, linhas 55–58', 'client.go', 55, 58),
      ],
    },
    {
      id: 'codigo',
      voice: 'fonte',
      body: [
        'Os trechos abaixo são da revisão 5fbf678, cada um com link para o arquivo e as linhas exatas no GitHub.',
        'O simulador depois deles não é código do tuxedo: é uma simulação com dados sintéticos do que eu colocaria na frente deste cliente (nova tentativa com backoff, chave de idempotência e disjuntor).',
      ],
      sources: [tree],
    },
  ],
  architecture: {
    caption: 'Caminho de uma chamada no tuxedo, da criação do cliente à decodificação. Célula tracejada: prometido e não implementado.',
    nodes: [
      { label: 'NewClient(timeout)', detail: 'Cria um *http.Client com um timeout único para todas as chamadas.', state: 'solid', source: src('client.go:24–28', 'client.go', 24, 28) },
      { label: 'client.R()', detail: 'Novo Request com o mapa de headers vazio.', state: 'solid', source: src('request.go:17–22', 'request.go', 17, 22) },
      { label: 'AddHeader · SetBody', detail: 'Cada método grava no Request e devolve o próprio Request.', state: 'solid', source: src('request.go:32–47', 'request.go', 32, 47) },
      { label: 'execute(method, url)', detail: 'http.NewRequest, headers com Set, JSON como Content-Type padrão, httpClient.Do.', state: 'solid', source: src('client.go:41–58', 'client.go', 41, 58) },
      { label: 'Tracing', detail: 'EnableTrace liga uma flag, mas o bloco em execute é um TODO: nada é registrado.', state: 'gap', source: src('client.go:52–54', 'client.go', 52, 54) },
      { label: 'Response', detail: 'io.ReadAll do body; devolve StatusCode, Headers e Body em bytes.', state: 'solid', source: src('client.go:59–70', 'client.go', 59, 70) },
      { label: 'res.Json · res.Xml', detail: 'json.Unmarshal ou xml.Unmarshal sobre os bytes já lidos.', state: 'solid', source: src('response.go:25–38', 'response.go', 25, 38) },
    ],
  },
  snippets: [
    {
      title: 'O builder',
      file: 'request.go',
      lines: [17, 35],
      lang: 'go',
      url: at('request.go', 17, 35),
      code: tuxedoRequest,
      caption: '`R()` cria o Request; `AddHeader` grava no mapa e devolve o próprio Request para encadear.',
    },
    {
      title: 'O ritual do net/http, escrito uma vez',
      file: 'client.go',
      lines: [41, 71],
      lang: 'go',
      url: at('client.go', 41, 71),
      code: tuxedoExecute,
      caption: 'Tudo o que o README chama de boilerplate: montar, aplicar headers, chamar `Do`, fechar e ler. O `TODO` do tracing está na linha 53.',
    },
    {
      title: 'O log.Fatal',
      file: 'utils.go',
      lines: [8, 12],
      lang: 'go',
      url: at('utils.go', 8, 12),
      code: tuxedoDoClose,
      caption: 'Se o `Close` do body falhar, o processo inteiro termina.',
    },
  ],
  measurements: [
    {
      what: 'Suíte de testes',
      command: 'go test -count=1 -v ./...',
      environment: 'Go 1.26.4 linux/amd64, WSL2 (Linux 6.18), clone da revisão 5fbf678',
      date: '2026-09-27',
      result: '1 teste (TestGet), PASS',
      source: tree,
    },
    {
      what: 'Cobertura de instruções',
      command: 'go test -count=1 -cover ./...',
      environment: 'Go 1.26.4 linux/amd64, WSL2 (Linux 6.18), clone da revisão 5fbf678',
      date: '2026-09-27',
      result: '62,5%',
      source: tree,
    },
    {
      what: 'Análise estática',
      command: 'go vet ./...',
      environment: 'Go 1.26.4 linux/amd64, WSL2 (Linux 6.18), clone da revisão 5fbf678',
      date: '2026-09-27',
      result: 'Nenhum aviso',
      source: tree,
    },
  ],
}
