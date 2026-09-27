/** Dados editoriais pequenos (livros, jogos, badges, autor, perfis), validados por Zod ao carregar. */
import { z } from 'zod'
import { authorSchema, badgeSchema, boardGameSchema, bookSchema, socialLinkSchema } from './schema'

export const author = authorSchema.parse({
  username: 'whoisclebs',
  name: 'Clebson A. Fonseca',
  avatar: '/profile/clebson.png',
  bio: 'Engenheiro de software, líder técnico e entusiasta de código aberto.',
})

export const contactEmail = 'hello@whoisclebs.com'

export const socialLinks = z.array(socialLinkSchema).parse([
  { label: 'GitHub', href: 'https://github.com/whoisclebs' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/whoisclebs' },
  { label: 'Substack', href: 'https://whoisclebs.substack.com' },
  { label: 'YouTube', href: 'https://www.youtube.com/@whoisclebs' },
  { label: 'Dribbble', href: 'https://dribbble.com/whoisclebs' },
])

export const books = z.array(bookSchema).parse([
  {
    title: 'Código Limpo: Habilidades Práticas do Agile Software',
    author: 'Robert C. Martin',
    image: 'https://m.media-amazon.com/images/I/71dH97FwGbL._SY385_.jpg',
    link: 'https://amzn.to/43x7SAj',
    affiliate: true,
  },
  {
    title: 'Roube como um artista: 10 dicas sobre criatividade',
    author: 'Austin Kleon',
    image: 'https://m.media-amazon.com/images/I/51lI9is-gnL._SY342_.jpg',
    link: 'https://amzn.to/3R1eQ9f',
    affiliate: true,
  },
])

export const boardGames = z.array(boardGameSchema).parse([
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
])

export const badges = z.array(badgeSchema).parse([
  {
    name: 'GitHub Foundations',
    issuer: 'GitHub',
    image: 'https://images.credly.com/images/024d0122-724d-4c5a-bd83-cfe3c4b7a073/image.png',
    url: 'https://www.credly.com/badges/73e75e6e-3858-4af6-91a1-0472d7cb823f',
    issuedAt: '2025',
  },
  {
    name: 'AWS Educate Getting Started with Storage',
    issuer: 'AWS Training and Certification',
    image: 'https://images.credly.com/images/3b1b42e6-dfc2-492b-90df-8058096cb93d/blob',
    url: 'https://www.credly.com/badges/7b6f6b82-0c88-4b4f-b5cf-e6a8bf6062aa',
    issuedAt: '2025',
  },
  {
    name: 'AWS Educate Introduction to Generative AI',
    issuer: 'AWS Training and Certification',
    image: 'https://images.credly.com/images/e50c657a-edd9-4c93-b1cf-2b6634b54abf/blob',
    url: 'https://www.credly.com/badges/c8b38dcd-342f-4339-b58d-8a851d4b8c1d',
    issuedAt: '2025',
  },
  {
    name: 'Lifelong Learning',
    issuer: 'Certiprof',
    image: 'https://images.credly.com/images/21e16d4d-d2df-46e6-9098-526caab49e63/blob',
    url: 'https://www.credly.com/badges/0daddb05-1b5f-4161-8b34-92887568b306',
    issuedAt: '2022',
  },
  {
    name: 'Scrum Foundation Professional Certification',
    issuer: 'Certiprof',
    image: 'https://images.credly.com/images/4e3d6f9f-55d7-4ea7-b0e6-f4d4ff543e22/image.png',
    url: 'https://www.credly.com/badges/3e73b606-b566-4d3a-8de9-f39021f23b8f',
    issuedAt: '2022',
  },
])
