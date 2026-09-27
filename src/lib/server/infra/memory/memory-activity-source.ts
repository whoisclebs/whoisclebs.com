import type { PublicActivitySource, SourceFetchResult } from '../../ports/public-activity-source'

type Step = SourceFetchResult | Error

/** Fonte roteirizada: devolve as respostas na ordem dada (a última se repete). Registra os ETags recebidos. */
export class MemoryActivitySource implements PublicActivitySource {
  readonly name = 'github'
  readonly receivedEtags: (string | null)[] = []

  constructor(private readonly steps: Step[]) {}

  async fetchRecent({ etag }: { etag: string | null }): Promise<SourceFetchResult> {
    this.receivedEtags.push(etag)
    const step = this.steps.length > 1 ? this.steps.shift() : this.steps[0]
    if (!step) throw new Error('MemoryActivitySource sem respostas configuradas')
    if (step instanceof Error) throw step
    return step
  }
}
