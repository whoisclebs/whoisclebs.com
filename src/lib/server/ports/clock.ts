/** Relógio injetável: o domínio nunca chama `Date.now()` direto, o que deixa os testes determinísticos. */
export interface Clock {
  now(): Date
}
