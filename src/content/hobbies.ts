export type BoardGame = {
  title: string
  note: string
  players: string
  image: string
}

export const boardGames: BoardGame[] = [
  {
    title: 'Azul: Master Chocolatier',
    note: 'Uma variação temática de Azul com a mesma elegância abstrata, decisões táticas curtas e uma presença de mesa deliciosa.',
    players: '2–4 jogadores',
    image: '/boardgames/azul_chocolatier.png',
  },
  {
    title: 'Clank!',
    note: 'Deck-building com exploração de dungeon, risco crescente e aquela tensão boa de sair vivo antes do dragão acordar de vez.',
    players: '2–4 jogadores',
    image: '/boardgames/clank.png',
  },
  {
    title: 'Scrabble',
    note: 'Palavras, vocabulário e disputa por espaço no tabuleiro — simples, clássico e sempre dependente de criatividade.',
    players: '2–4 jogadores',
    image: '/boardgames/scrabble.png',
  },
  {
    title: 'Stella',
    note: 'Um jogo do universo Dixit sobre associação de imagens, leitura coletiva e apostas sutis sobre como os outros pensam.',
    players: '3–6 jogadores',
    image: '/boardgames/stella.png',
  },
]
