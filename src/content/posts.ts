const markdownModules = import.meta.glob('./posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

export const markdownPostSources = Object.entries(markdownModules).map(([path, raw]) => ({ path, raw }))
