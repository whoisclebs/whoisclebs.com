const markdownModules = import.meta.glob('./til/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

export const markdownTilSources = Object.entries(markdownModules).map(([path, raw]) => ({ path, raw }))
