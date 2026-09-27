/**
 * Capítulo "IA agêntica" (passo 09). Só pt-BR, como os cases: texto novo, sem tradução revisada.
 *
 * Verdade editorial: todo projeto tem um status da lista fechada abaixo; "produção" e "protótipo" exigem
 * código público (validado em `agentProjectIssues`, coberto por teste). Nenhum número de benchmark aparece
 * aqui: os resultados publicados no repositório do YandeCode não cumprem os critérios de `EVALUATION_CRITERIA`
 * (motivo escrito na seção "Avaliação"). Fontes conferidas pela API do GitHub e em clones rasos em 2026-09-27.
 */

export type AgentStatus = 'producao' | 'prototipo' | 'pesquisa' | 'privado' | 'sem-codigo-publico'

export const AGENT_STATUS: Record<AgentStatus, { label: string; meaning: string }> = {
  producao: { label: 'Produção', meaning: 'usado por outras pessoas, com evidência pública desse uso' },
  prototipo: { label: 'Protótipo', meaning: 'código público que roda, sem uso em produção demonstrado' },
  pesquisa: { label: 'Pesquisa', meaning: 'estudo ou experimento publicado, sem intenção de uso' },
  privado: { label: 'Privado', meaning: 'existe, mas o código não é público' },
  'sem-codigo-publico': { label: 'Em construção, sem código público', meaning: 'intenção declarada, nada para conferir ainda' },
}

/** Estados que afirmam que algo roda: exigem URL pública de código. */
export const STATUSES_REQUIRING_CODE: readonly AgentStatus[] = ['producao', 'prototipo']

export interface Source {
  label: string
  url: string
}

export interface AgentProject {
  slug: string
  name: string
  status: AgentStatus
  summary: string
  /** Ressalva que acompanha o status (o que não afirmo). */
  note: string
  code?: { url: string; license: string }
  lastCommit?: { sha: string; date: string; url: string }
  release?: { label: string; date: string; url: string }
  sources: Source[]
}

export const AGENTS_CHECKED_AT = '2026-09-27'

const YC = 'https://github.com/yandelabs/yandecode'
const YC_SHA = 'cc46a6a6d6dc96c5a1c22d80107f6fb1ec91bec1'
const SN = 'https://github.com/whoisclebs/sentinel'
const SN_SHA = '8874085c9034630bcfa9b158c3cfb51f61a65892'

const yc = (path: string) => `${YC}/blob/${YC_SHA}/${path}`
const sn = (path: string) => `${SN}/blob/${SN_SHA}/${path}`

export const agentProjects: readonly AgentProject[] = [
  {
    slug: 'yandecode',
    name: 'YandeCode',
    status: 'prototipo',
    summary:
      'Uma camada em volta do Claude Code: busca de código por símbolo, saída longa de comandos guardada fora da janela de contexto, memória em arquivos Markdown, checagens do próprio projeto e uma regra que barra comandos perigosos. Roda local, sem chave de API.',
    note: 'Publicado no npm e instalável, mas sem usuários, adoção ou uso em produção que eu possa mostrar. A versão 0.1 continua em github.com/whoisclebs/yandecode (último commit 144ed75, 17 set. 2026).',
    code: { url: YC, license: 'MIT' },
    lastCommit: { sha: YC_SHA, date: '2026-09-27', url: `${YC}/commit/${YC_SHA}` },
    release: { label: '0.2.0 no npm', date: '2026-09-27', url: `${YC}/releases/tag/v0.2.0` },
    sources: [
      { label: 'README do YandeCode', url: yc('README.md') },
      { label: 'Repositório da 0.1', url: 'https://github.com/whoisclebs/yandecode/tree/144ed756d01e97d4087884d7d88fc0f379fe2108' },
    ],
  },
  {
    slug: 'sentinel',
    name: 'SENTINEL',
    status: 'prototipo',
    summary:
      'Auditoria de release em vários repositórios. Detectores sem modelo acham no diff as mudanças que afetam a operação (variável de ambiente, migração, recurso de nuvem) e um modelo avalia se o documento de release cobre cada uma, com citação obrigatória.',
    note: 'O próprio README o chama de prova de conceito em implementação. Sem licença declarada: o código está visível, mas não liberado para reuso.',
    code: { url: SN, license: 'sem licença' },
    lastCommit: { sha: SN_SHA, date: '2026-09-18', url: `${SN}/commit/${SN_SHA}` },
    sources: [{ label: 'README do SENTINEL', url: sn('README.md') }],
  },
  {
    slug: 'orquestrador-go',
    name: 'Orquestrador de agentes em Go',
    status: 'sem-codigo-publico',
    summary: 'O projeto citado no bloco "Agora" da home (atualizado em 2 jul. 2026).',
    note: 'Não há repositório público. Por isso não descrevo arquitetura nem resultado dele aqui.',
    sources: [],
  },
]

/** As cinco partes do laço, na ordem em que acontecem (nível 1, linguagem simples). */
export interface LoopStep {
  id: string
  title: string
  text: string
  example: Source & { text: string }
}

export const loopSteps: readonly LoopStep[] = [
  {
    id: 'objetivo',
    title: 'Objetivo',
    text: 'Tudo começa numa tarefa com um critério de pronto que dá para checar: um teste que passa, um relatório com citação. Sem isso, o agente não sabe quando parar, e você também não.',
    example: { text: 'No SENTINEL, pronto é um veredito por achado: documentado, faltando ou inconclusivo.', label: 'README, "How it works"', url: sn('README.md') },
  },
  {
    id: 'contexto',
    title: 'Seleção de contexto',
    text: 'O modelo só sabe o que cabe na janela. Em vez de despejar arquivos inteiros, o agente pede o trecho que importa: onde a função está definida, quais linhas do log falharam.',
    example: { text: 'O YandeCode responde "onde está X" com linhas caminho:linha, nunca com o arquivo inteiro.', label: 'ADR-017', url: yc('docs/adr/ADR-017-structural-code-navigation.md') },
  },
  {
    id: 'acoes',
    title: 'Ações',
    text: 'O agente age por ferramentas: ler, buscar, editar, rodar um comando. Cada ferramenta é uma permissão, e as perigosas passam por uma regra antes de rodar.',
    example: { text: 'Uma tabela de regras barra segredos, arquivos de credencial, sudo e comandos destrutivos.', label: 'ADR-022', url: yc('docs/adr/ADR-022-deterministic-guard.md') },
  },
  {
    id: 'avaliacao',
    title: 'Avaliação',
    text: 'Quem diz se deu certo é uma checagem fora do modelo: testes, typecheck, um schema. Quando a evidência não basta, a resposta certa é "inconclusivo", não um palpite.',
    example: { text: 'Sem contexto recuperado, o juiz do SENTINEL devolve inconclusivo sem chamar o modelo.', label: 'documentation-judge.ts, linhas 38–59', url: `${sn('packages/core/src/services/documentation-judge.ts')}#L38-L59` },
  },
  {
    id: 'observabilidade',
    title: 'Observabilidade',
    text: 'Cada passo deixa rastro: o comando, a saída completa, a regra que bloqueou. É o que transforma um erro do agente em algo que se investiga, e o que se aprende vira o próximo objetivo.',
    example: { text: 'A saída inteira de cada comando fica guardada e pode ser buscada linha a linha depois.', label: 'ADR-019', url: yc('docs/adr/ADR-019-context-sandbox.md') },
  },
]

/** Nível 2: detalhes técnicos. `approach` = como eu abordo; `inCode` = o que o código público mostra. */
export interface TechTopic {
  id: string
  title: string
  approach: string[]
  inCode: string[]
  sources: Source[]
}

export const EVALUATION_CRITERIA: readonly string[] = [
  'um conjunto fixo de tarefas, cada uma com critério de aceite automático',
  'uma linha de base: a mesma tarefa sem a ferramenta',
  'várias execuções por braço, porque o modelo varia de uma rodada para outra',
  'custo por execução e taxa de sucesso',
  'versões do modelo e do código, e a data',
  'tudo reproduzível a partir de um commit público',
]

export const techTopics: readonly TechTopic[] = [
  {
    id: 'limites-de-contexto',
    title: 'Limites de contexto',
    approach: [
      'Janela de contexto é orçamento, não depósito. Três regras: responder "onde está X" com linhas `caminho:linha`, não com arquivos; toda resposta tem teto de tamanho e diz o que cortou; saída longa (log de teste, `git log`) fica fora da janela, com um resumo e um identificador para buscar qualquer linha depois.',
    ],
    inCode: [
      'O YandeCode implementa as três. A versão 0.1 apostava em busca vetorial sobre o código; a 0.2 trocou por navegação estrutural (símbolos, BM25 e grafo de imports) porque a relevância medida em tarefas reais saiu baixa, segundo o próprio ADR.',
    ],
    sources: [
      { label: 'ADR-017: navegação estrutural', url: yc('docs/adr/ADR-017-structural-code-navigation.md') },
      { label: 'ADR-019: saída fora da janela', url: yc('docs/adr/ADR-019-context-sandbox.md') },
    ],
  },
  {
    id: 'memoria',
    title: 'Memória',
    approach: [
      'Memória é dado com dono e prazo de validade. Uma memória errada é pior que nenhuma: ela volta em toda sessão. Por isso o agente escreve de forma explícita, cada memória cita a fonte, uma nova pode substituir a antiga e as temporárias expiram.',
    ],
    inCode: [
      'No YandeCode, memórias são arquivos Markdown com tipo (decisão, padrão, fato, falha), fontes e expiração; uma memória cuja fonte sumiu aparece marcada como velha. Resumir cada chamada com um modelo foi recusado: custa tokens o tempo todo.',
    ],
    sources: [{ label: 'ADR-020: conhecimento e memória', url: yc('docs/adr/ADR-020-knowledge-and-memory.md') }],
  },
  {
    id: 'permissoes',
    title: 'Permissões',
    approach: [
      'O agente herda as permissões do ambiente em que roda e nunca pede credenciais. O que é destrutivo passa por uma regra determinística antes de acontecer, e a regra registra cada decisão para ser ajustada depois.',
    ],
    inCode: [
      'O YandeCode nunca chama a API do modelo nem pede chave: quem executa é o Claude Code, com as permissões dele. A regra de bloqueio (segredos, `.env`, `sudo`, `rm -rf` em diretórios raiz, `push --force` na main) falha aberta: um bloqueio quebrado não pode parar todo o trabalho, então ela é opcional. No SENTINEL, a auditoria nunca altera tag, repositório ou documento.',
    ],
    sources: [
      { label: 'ADR-001: o Claude Code executa', url: yc('docs/adr/ADR-001-claude-code-as-execution-runtime.md') },
      { label: 'ADR-022: regra determinística', url: yc('docs/adr/ADR-022-deterministic-guard.md') },
      { label: 'README do SENTINEL, "Usage"', url: sn('README.md') },
    ],
  },
  {
    id: 'avaliacao',
    title: 'Avaliação',
    approach: ['Só publico um resultado de agente se ele tiver:'],
    inCode: [
      'Por isso não há número nesta página. O YandeCode publica resultados em `benchmarks/results/`, mas o resumo foi medido nos commits `f963e38` e `73046d7`, que não existem no histórico público; a comparação de busca usa 12 consultas numa fixture pequena e mede recuperação, não tarefa resolvida; e o A/B com o Claude Code tem uma execução por braço e tarefa. É material de trabalho honesto, mas não sustenta uma afirmação de ganho. Quando existir uma rodada que cumpra a lista, ela entra aqui com o link.',
    ],
    sources: [
      { label: 'benchmarks/results/SUMMARY.md', url: yc('benchmarks/results/SUMMARY.md') },
      { label: 'A/B de 26 set. 2026 (JSON)', url: yc('benchmarks/results/ab-pacolang-2026-09-26.json') },
    ],
  },
  {
    id: 'falhas',
    title: 'Falhas',
    approach: [
      'Os modos de falha que entram no desenho desde o começo: o modelo inventa um fato quando falta evidência; a saída vem num formato inválido; o provedor cai; o agente repete a mesma ação em laço; uma ação destrutiva passa.',
    ],
    inCode: [
      'O SENTINEL cobre os três primeiros no juiz: sem contexto recuperado, devolve inconclusivo sem chamar o modelo; a resposta é validada por schema e repetida um número limitado de vezes; se ainda falhar, vira inconclusivo com o erro sanitizado. O prompt exige citar o trecho que sustenta o veredito. Para laço e orçamento de passos ainda não tenho código público que mostre a solução.',
    ],
    sources: [
      { label: 'documentation-judge.ts, linhas 19–59', url: `${sn('packages/core/src/services/documentation-judge.ts')}#L19-L59` },
      { label: 'judge-prompt.ts', url: sn('packages/core/src/services/judge-prompt.ts') },
    ],
  },
]

/** Problemas de verdade editorial na lista de projetos; vazio = ok. */
export function agentProjectIssues(list: readonly AgentProject[]): string[] {
  const issues: string[] = []
  for (const project of list) {
    const isPublicCode = project.code && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(project.code.url)
    if (STATUSES_REQUIRING_CODE.includes(project.status) && !isPublicCode) {
      issues.push(`${project.slug}: status "${project.status}" exige URL pública de código`)
    }
    if (project.status === 'sem-codigo-publico' && project.code) {
      issues.push(`${project.slug}: "sem código público" não pode ter URL de código`)
    }
    if (project.code && !project.lastCommit) issues.push(`${project.slug}: código público sem último commit datado`)
    for (const source of project.sources) {
      if (!source.url.startsWith('https://')) issues.push(`${project.slug}: fonte sem https (${source.url})`)
    }
  }
  return issues
}
