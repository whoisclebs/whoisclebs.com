import { describe, expect, it } from 'vitest'
import { createKeyTracker, KONAMI, type KeyAction } from './keys'

/** Digita uma sequência de teclas com intervalo fixo entre elas e devolve as ações que saíram. */
function type(keys: readonly string[], step = 120, tracker = createKeyTracker()): KeyAction[] {
  const actions: KeyAction[] = []
  let at = 1_000
  for (const key of keys) {
    const action = tracker.push(key, at)
    if (action) actions.push(action)
    at += step
  }
  return actions
}

const chars = (text: string) => [...text]

describe('createKeyTracker', () => {
  it('reconhece o código Konami', () => {
    expect(type(KONAMI)).toEqual([{ type: 'neon' }])
  })

  it('aceita B e A maiúsculos no Konami', () => {
    expect(type([...KONAMI.slice(0, 8), 'B', 'A'])).toEqual([{ type: 'neon' }])
  })

  it('não dispara com o Konami incompleto', () => {
    expect(type(KONAMI.slice(0, 9))).toEqual([])
  })

  it('dispara de novo num segundo Konami seguido', () => {
    expect(type([...KONAMI, ...KONAMI])).toEqual([{ type: 'neon' }, { type: 'neon' }])
  })

  it('? alterna o painel e Escape fecha', () => {
    expect(type(['?'])).toEqual([{ type: 'help' }])
    expect(type(['Escape'])).toEqual([{ type: 'close' }])
  })

  it('g seguido de a, p, s ou h navega', () => {
    expect(type(['g', 'a'])).toEqual([{ type: 'go', target: 'writing' }])
    expect(type(['g', 'p'])).toEqual([{ type: 'go', target: 'projects' }])
    expect(type(['g', 's'])).toEqual([{ type: 'go', target: 'about' }])
    expect(type(['g', 'h'])).toEqual([{ type: 'go', target: 'home' }])
  })

  it('g + tecla expira depois de 900 ms', () => {
    expect(type(['g', 'a'], 899)).toEqual([{ type: 'go', target: 'writing' }])
    expect(type(['g', 'a'], 901)).toEqual([])
  })

  it('g no meio de uma palavra digitada não vira atalho', () => {
    // "logs", "dogs", "bugs", "magia", "pega": o g vem colado a outra letra.
    for (const word of ['logs', 'dogs', 'bugs', 'magia', 'pega', 'agh']) {
      expect(type(chars(word))).toEqual([])
    }
  })

  it('g depois de uma pausa ou de um espaço volta a ser atalho', () => {
    const tracker = createKeyTracker()
    expect(tracker.push('o', 0)).toBeNull()
    expect(tracker.push('g', 2_000)).toBeNull()
    expect(tracker.push('a', 2_100)).toEqual({ type: 'go', target: 'writing' })
    expect(type(chars('ok ga'))).toEqual([{ type: 'go', target: 'writing' }])
  })

  it('reconhece as palavras sem diferenciar maiúsculas', () => {
    expect(type(chars('clebs'))).toEqual([{ type: 'word', word: 'clebs' }])
    expect(type(chars('CLEBS'))).toEqual([{ type: 'word', word: 'clebs' }])
    expect(type(chars('sudo'))).toEqual([{ type: 'word', word: 'sudo' }])
    expect(type(chars('rm -rf'))).toEqual([{ type: 'word', word: 'rm' }])
    expect(type(chars('chuva'))).toEqual([{ type: 'word', word: 'rain' }])
    expect(type(chars('rain'))).toEqual([{ type: 'word', word: 'rain' }])
  })

  it('cometa dispara uma vez só (comet é prefixo de cometa)', () => {
    expect(type(chars('cometa'))).toEqual([{ type: 'word', word: 'comet' }])
    expect(type(chars('comet'))).toEqual([{ type: 'word', word: 'comet' }])
  })

  it('acha a palavra no fim de um texto maior', () => {
    expect(type(chars('oi clebs'))).toEqual([{ type: 'word', word: 'clebs' }])
  })

  it('a palavra tem prioridade sobre o g + tecla', () => {
    // "g" + "s" em "clebs" não acontece (o g não está lá), mas uma palavra que termina logo depois de um g
    // isolado continua sendo palavra: o buffer é avaliado antes do atalho.
    const tracker = createKeyTracker()
    let at = 0
    let last: KeyAction | null = null
    for (const key of chars('sud')) last = tracker.push(key, (at += 100))
    expect(last).toBeNull()
    expect(tracker.push('o', at + 100)).toEqual({ type: 'word', word: 'sudo' })
  })

  it('ignora teclas de controle no buffer de palavras', () => {
    expect(type(['c', 'l', 'Shift', 'e', 'b', 's'])).toEqual([{ type: 'word', word: 'clebs' }])
  })

  it('reset esquece o que foi digitado', () => {
    const tracker = createKeyTracker()
    for (const key of chars('cleb')) tracker.push(key, 0)
    tracker.reset()
    expect(tracker.push('s', 10)).toBeNull()
  })
})
