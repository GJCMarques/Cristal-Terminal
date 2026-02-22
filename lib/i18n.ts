// ============================================================
// CRISTAL CAPITAL TERMINAL — Motor i18n + Formatadores Intl
// ============================================================

import { useTerminalStore } from '@/store/terminal.store'
import { pt } from '@/i18n/pt'
import { en } from '@/i18n/en'
import { es } from '@/i18n/es'
import type { Traducoes } from '@/i18n/pt'

export type Locale = 'pt' | 'en' | 'es'

const TRADUCOES: Record<Locale, Traducoes> = { pt, en, es }

const LOCALES_INTL: Record<Locale, string> = {
  pt: 'pt-PT',
  en: 'en-US',
  es: 'es-ES',
}

const TIMEZONES: Record<Locale, string> = {
  pt: 'Europe/Lisbon',
  en: 'America/New_York',
  es: 'Europe/Madrid',
}

// ── Hook principal ────────────────────────────────────────────

export function useTranslation() {
  const locale = useTerminalStore((s) => s.locale) as Locale
  const t = TRADUCOES[locale] ?? pt
  return { t, locale }
}

// ── Formatadores Intl ─────────────────────────────────────────

export function formatarNumero(
  valor: number,
  locale: Locale,
  opts?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(LOCALES_INTL[locale], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...opts,
  }).format(valor)
}

export function formatarMoeda(
  valor: number,
  locale: Locale,
  moeda = 'USD',
): string {
  return new Intl.NumberFormat(LOCALES_INTL[locale], {
    style:                 'currency',
    currency:              moeda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatarPct(valor: number, locale: Locale): string {
  const sinal = valor >= 0 ? '+' : ''
  return `${sinal}${new Intl.NumberFormat(LOCALES_INTL[locale], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)}%`
}

export function formatarData(
  data: Date | string | number,
  locale: Locale,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const d = data instanceof Date ? data : new Date(data)
  return new Intl.DateTimeFormat(LOCALES_INTL[locale], {
    timeZone: TIMEZONES[locale],
    ...opts,
  }).format(d)
}

export function formatarHora(data: Date | string | number, locale: Locale): string {
  return formatarData(data, locale, {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: locale === 'en',
  })
}

export function formatarDataCurta(data: Date | string | number, locale: Locale): string {
  return formatarData(data, locale, {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

// Converte locale para nome legível
export const NOMES_LOCALE: Record<Locale, string> = {
  pt: 'PT',
  en: 'EN',
  es: 'ES',
}

export const BANDEIRAS_LOCALE: Record<Locale, string> = {
  pt: '🇵🇹',
  en: '🇺🇸',
  es: '🇪🇸',
}
