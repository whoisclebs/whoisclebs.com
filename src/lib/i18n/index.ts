import { en } from './en'
import { ptBR } from './pt-BR'

export const locales = ['pt-BR', 'en'] as const
export type Locale = (typeof locales)[number]
export type Messages = typeof ptBR

const catalog: Record<Locale, Messages> = { 'pt-BR': ptBR, en }

/** O idioma vem só da URL: `/en` e `/en/...` são inglês; todo o resto é pt-BR. */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pt-BR'
}

export function getMessages(locale: Locale): Messages {
  return catalog[locale]
}

export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}

/** Datas `YYYY-MM-DD` formatadas no fuso UTC para o resultado não depender da máquina do build. */
export function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .replace('.', '')
}

/** Dia e mês (`16 set`, `Sep 16`), para listas já agrupadas por ano. */
export function formatDayMonth(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .replace('.', '')
    .replace(' de ', ' ')
}
