import { useI18n } from './i18n'
import { localizePath } from './locale-routing'

export function useLocalizedPath() {
  const { locale } = useI18n()
  return (path: string) => localizePath(path, locale)
}
