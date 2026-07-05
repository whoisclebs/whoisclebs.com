const markdownModules = import.meta.glob('./posts/*/{pt-BR,en}.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

export const markdownPostSources = Object.entries(markdownModules).map(([path, raw]) => ({ path, raw }))
