/**
 * Lado do servidor: o efeito (a cobrança) e a memória de chaves de idempotência já processadas.
 * Com chave repetida, o servidor devolve o resultado guardado e não cobra de novo.
 */
export interface Ledger {
  /** Chaves já processadas com sucesso. */
  keys: string[]
  /** Cobranças efetivadas, na ordem. */
  charges: { order: number; key: string | null }[]
}

export function emptyLedger(): Ledger {
  return { keys: [], charges: [] }
}

export function applyEffect(ledger: Ledger, order: number, key: string | null): { ledger: Ledger; charged: boolean; replayed: boolean } {
  if (key !== null && ledger.keys.includes(key)) return { ledger, charged: false, replayed: true }
  return {
    ledger: { keys: key === null ? ledger.keys : [...ledger.keys, key], charges: [...ledger.charges, { order, key }] },
    charged: true,
    replayed: false,
  }
}
