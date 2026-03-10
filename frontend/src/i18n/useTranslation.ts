/**
 * useTranslation hook — returns t() function for current language.
 */

import { useStore } from '../store/useStore'
import { translations } from './translations'
import type { Lang } from './translations'

export function useTranslation() {
  const lang = useStore((s) => s.lang)
  const t = translations[lang] || translations.en
  return { t, lang }
}

export { translations, type Lang }
