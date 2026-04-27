export type Author = {
  username: string
  name: string
  avatar: string
  bio: string
}

export const authors: Record<string, Author> = {
  whoisclebs: {
    username: 'whoisclebs',
    name: 'Clebson A. Fonseca',
    avatar: '/profile/clebson.png',
    bio: 'Engenheiro de software, líder técnico e entusiasta de código aberto.',
  },
}

export function getAuthorByUsername(username: string): Author | undefined {
  return authors[username]
}
