/** Ordem editorial: mais recente primeiro; empate resolvido pelo slug para ser determinístico. */
export function sortByDateDesc<T extends { date: string; slug: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
}
