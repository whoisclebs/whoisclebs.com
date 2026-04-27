export type BoardGame = {
  title: string
  note: string
  players: string
  image: string
}

export const boardGames: BoardGame[] = [
  {
    title: 'Azul',
    note: 'Abstrato elegante, rápido de explicar e cheio de pequenas decisões táticas.',
    players: '2–4 jogadores',
    image: 'https://placehold.co/600x400/ffffff/1a1a1a?text=Board+Game',
  },
  {
    title: 'Ticket to Ride',
    note: 'Construção de rotas, tensão leve e uma ótima porta de entrada para mesa cheia.',
    players: '2–5 jogadores',
    image: 'https://placehold.co/600x400/ffffff/1a1a1a?text=Board+Game',
  },
  {
    title: 'Coup',
    note: 'Blefe curto, direto e caótico o bastante para gerar boas histórias depois da partida.',
    players: '2–6 jogadores',
    image: 'https://placehold.co/600x400/ffffff/1a1a1a?text=Board+Game',
  },
  {
    title: 'Dixit',
    note: 'Criatividade, interpretação e imagens que viram conversa ao redor da mesa.',
    players: '3–8 jogadores',
    image: 'https://placehold.co/600x400/ffffff/1a1a1a?text=Board+Game',
  },
  {
    title: '7 Wonders Duel',
    note: 'Confronto estratégico para duas pessoas, com ritmo forte e múltiplos caminhos de vitória.',
    players: '2 jogadores',
    image: 'https://placehold.co/600x400/ffffff/1a1a1a?text=Board+Game',
  },
  {
    title: 'Pandemic',
    note: 'Cooperação, pressão crescente e decisões coletivas que lembram incidentes em produção.',
    players: '2–4 jogadores',
    image: 'https://placehold.co/600x400/ffffff/1a1a1a?text=Board+Game',
  },
]
