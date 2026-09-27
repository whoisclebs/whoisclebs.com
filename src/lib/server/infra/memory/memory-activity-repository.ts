import type { PublicActivityItem } from '../../domain/public-activity'
import type { PublicActivityRepository, SyncCursor } from '../../ports/public-activity-repository'

/** Repositório em memória com a mesma semântica do adaptador D1 (usado em testes e no contrato HTTP). */
export class MemoryActivityRepository implements PublicActivityRepository {
  private items = new Map<string, PublicActivityItem>()
  private cursors = new Map<string, SyncCursor>()
  /** Quando definido, toda operação lança este erro (simula banco indisponível). */
  failWith: Error | null = null

  constructor(seed: { items?: PublicActivityItem[]; cursor?: SyncCursor } = {}) {
    for (const item of seed.items ?? []) this.items.set(item.id, { ...item })
    if (seed.cursor) this.cursors.set(seed.cursor.source, { ...seed.cursor })
  }

  private guard(): void {
    if (this.failWith) throw this.failWith
  }

  async listRecent(limit: number): Promise<PublicActivityItem[]> {
    this.guard()
    return [...this.items.values()]
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id))
      .slice(0, limit)
      .map((item) => ({ ...item }))
  }

  async replaceItems(items: readonly PublicActivityItem[]): Promise<void> {
    this.guard()
    const next = new Map<string, PublicActivityItem>()
    for (const item of items) next.set(item.id, { ...item })
    this.items = next
  }

  async getCursor(source: string): Promise<SyncCursor | null> {
    this.guard()
    const cursor = this.cursors.get(source)
    return cursor ? { ...cursor } : null
  }

  async saveCursor(cursor: SyncCursor): Promise<void> {
    this.guard()
    this.cursors.set(cursor.source, { ...cursor })
  }
}
