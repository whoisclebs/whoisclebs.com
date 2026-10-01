/**
 * Case tuxedo, em primeira pessoa. Cada afirmação foi conferida em 2026-10-01 num clone da revisão
 * 5fbf678 (último commit de `main`). Texto entre crases vira `<code>`; `[texto](url)` vira link.
 */
import type { CaseStudyInput } from '../case-schema.ts'
import { tuxedoDoClose, tuxedoExecute, tuxedoRequest } from './snippets.ts'

const REPO = 'https://github.com/whoisclebs/tuxedo'
const SHA = '5fbf678c40f9d0c628a960ea353204c205faf9d7'
const at = (file: string, from?: number, to?: number) =>
  `${REPO}/blob/${SHA}/${file}${from ? `#L${from}${to && to !== from ? `-L${to}` : ''}` : ''}`
const src = (label: string, file: string, from?: number, to?: number) => ({ label, url: at(file, from, to) })

const ENV = 'Go 1.26.4 linux/amd64, WSL2, clone da revisão 5fbf678'

export const tuxedoCase: CaseStudyInput = {
  slug: 'tuxedo',
  title: 'tuxedo: um cliente HTTP encadeável para Go',
  dek: 'Escrevi o tuxedo em março de 2025 para montar chamadas HTTP em Go com menos boilerplate. São quatro arquivos, nenhuma dependência e algumas partes que ficaram pela metade.',
  checkedAt: '2026-10-01',
  revision: { sha: SHA, date: '2025-03-04', url: `${REPO}/commit/${SHA}` },
  sections: [
    {
      id: 'por-que-existe',
      title: 'Por que existe',
      body: [
        `No [README](${at('README.md')}) descrevi um cliente HTTP leve e encadeável em cima do \`net/http\`, com a API inspirada no Resty, headers, body, tracing e JSON decodificado na resposta.`,
        `O primeiro commit é de 3 de março de 2025 e o último, do dia seguinte. Foram 13 commits e duas tags de pré-versão, [v0.0.1 e v0.1.0-alpha](${REPO}/releases).`,
        `A API é inspirada no Resty, mas ele não é dependência. O [\`go.mod\`](${at('go.mod')}) não tem nenhum \`require\`: tudo usa a biblioteca padrão.`,
      ],
    },
    {
      id: 'como-funciona',
      title: 'Como funciona',
      body: [
        `[\`NewClient\`](${at('client.go', 24, 28)}) cria um \`*http.Client\` com um timeout que vale para todas as chamadas. [\`client.R()\`](${at('request.go', 17, 22)}) abre um \`Request\`, e \`AddHeader\`, \`SetBody\` e \`EnableTrace\` devolvem o próprio \`Request\` para encadear. O verbo no fim (\`Get\`, \`Post\`, \`Put\` ou \`Delete\`) dispara a chamada.`,
        `Os quatro verbos caem em [\`execute\`](${at('client.go', 41, 71)}), que é o boilerplate escrito uma vez: monta o \`http.Request\`, aplica os headers, chama \`Do\`, fecha o body e lê os bytes. Se tem body e ninguém definiu \`Content-Type\`, mando \`application/json\`.`,
        `A resposta volta com status, headers e o body inteiro em memória, lido com \`io.ReadAll\`. Decodificar fica para depois, com [\`res.Json(&alvo)\` ou \`res.Xml(&alvo)\`](${at('response.go', 25, 38)}).`,
        'O código cabe em quatro arquivos e 227 linhas, fora os testes. O maior, `client.go`, tem 119.',
      ],
      figures: ['architecture'],
    },
    {
      id: 'pela-metade',
      title: 'O que ficou pela metade',
      body: [
        `\`EnableTrace\` só liga uma flag. O bloco que devia usá-la em \`execute\` é um [\`// TODO: Add trace logs\`](${at('client.go', 52, 54)}), então o tracing que o README promete ainda não existe.`,
        `Se fechar o body da resposta falhar, [\`doClose\`](${at('utils.go', 8, 12)}) chama \`log.Fatal\` e encerra o programa de quem usa a biblioteca.`,
        `[\`execute\`](${at('client.go', 42)}) usa \`http.NewRequest\`, sem \`context.Context\`. Não dá para cancelar uma chamada específica; só existe o timeout do cliente inteiro.`,
        `No segundo dia renomeei \`SetHeader\` para \`AddHeader\` "por consistência", como diz a mensagem do [commit 1e61dc8](${REPO}/commit/1e61dc80465f386356282d5a80420a6576f757bd). O nome mudou e o comportamento ficou o de antes: [\`AddHeader\`](${at('request.go', 32, 35)}) grava num \`map[string]string\` e \`execute\` aplica com \`Header.Set\`. Chamar duas vezes com a mesma chave troca o valor, enquanto o \`http.Header.Add\` acumularia.`,
      ],
    },
    {
      id: 'testes',
      title: 'Testes',
      body: [
        `Tem um teste, [\`TestGet\`](${at('client_test.go', 35, 45)}): um GET com header contra um \`httptest.Server\`. \`Post\`, \`Put\`, \`Delete\`, \`Json\` e \`Xml\` ainda não têm teste.`,
        'A mensagem de falha desse GET fala em POST, e o helper de comparação se chama `assetEqual`, com um r a menos.',
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
    caption: 'Caminho de uma chamada no tuxedo, de NewClient até a decodificação. A célula tracejada é o tracing, que ainda não existe.',
    nodes: [
      { label: 'NewClient(timeout)', detail: 'Cria um *http.Client com um timeout único para todas as chamadas.', state: 'solid', source: src('client.go:24–28', 'client.go', 24, 28) },
      { label: 'client.R()', detail: 'Novo Request com o mapa de headers vazio.', state: 'solid', source: src('request.go:17–22', 'request.go', 17, 22) },
      { label: 'AddHeader · SetBody', detail: 'Cada método grava no Request e devolve o próprio Request.', state: 'solid', source: src('request.go:32–47', 'request.go', 32, 47) },
      { label: 'execute(method, url)', detail: 'http.NewRequest, headers com Set, JSON como Content-Type padrão, httpClient.Do.', state: 'solid', source: src('client.go:41–58', 'client.go', 41, 58) },
      { label: 'Tracing', detail: 'EnableTrace liga uma flag; o bloco em execute é um TODO e não registra nada.', state: 'gap', source: src('client.go:52–54', 'client.go', 52, 54) },
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
      caption: '`R()` cria o `Request`; `AddHeader` grava no mapa e devolve o próprio `Request` para encadear.',
    },
    {
      title: 'O boilerplate do net/http, escrito uma vez',
      file: 'client.go',
      lines: [41, 71],
      lang: 'go',
      url: at('client.go', 41, 71),
      code: tuxedoExecute,
      caption: 'Montar, aplicar headers, chamar `Do`, fechar e ler. O `TODO` do tracing está na linha 53.',
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
    { command: 'go test -count=1 -v ./...', environment: ENV, date: '2026-10-01', result: 'um teste, `TestGet`, passou' },
    { command: 'go test -count=1 -cover ./...', environment: ENV, date: '2026-10-01', result: '62,5% de cobertura de instruções' },
    { command: 'go vet ./...', environment: ENV, date: '2026-10-01', result: 'nenhum aviso' },
  ],
}
