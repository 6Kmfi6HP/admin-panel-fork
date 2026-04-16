/**
 * Blog content locales.
 *
 * Aligned with the admin-panel's own i18next translations shipped under
 * `src/i18n/translations/*.json`. The `code` is what gets persisted in
 * `article_translation.locale` and sent to the storefront as `?locale=...`.
 *
 * Keep this list in sync with `src/i18n/translations/` so operators writing
 * content always see the same language roster the UI itself supports.
 */
export type BlogLocale = {
  code: string
  /** Display name in the locale's own language. */
  native: string
  /** Display name in English, for fallback UIs. */
  english: string
  /** BCP-47 / hreflang tag (emitted on storefront). */
  hreflang: string
}

export const BLOG_LOCALES: BlogLocale[] = [
  { code: "ar",   native: "العربية",      english: "Arabic",            hreflang: "ar"    },
  { code: "bg",   native: "Български",    english: "Bulgarian",         hreflang: "bg"    },
  { code: "bs",   native: "Bosanski",     english: "Bosnian",           hreflang: "bs"    },
  { code: "cs",   native: "Čeština",      english: "Czech",             hreflang: "cs"    },
  { code: "de",   native: "Deutsch",      english: "German",            hreflang: "de"    },
  { code: "el",   native: "Ελληνικά",     english: "Greek",             hreflang: "el"    },
  { code: "en",   native: "English",      english: "English",           hreflang: "en"    },
  { code: "es",   native: "Español",      english: "Spanish",           hreflang: "es"    },
  { code: "fa",   native: "فارسی",         english: "Persian",           hreflang: "fa"    },
  { code: "fr",   native: "Français",     english: "French",            hreflang: "fr"    },
  { code: "he",   native: "עברית",         english: "Hebrew",            hreflang: "he"    },
  { code: "hu",   native: "Magyar",       english: "Hungarian",         hreflang: "hu"    },
  { code: "id",   native: "Bahasa Indonesia", english: "Indonesian",    hreflang: "id"    },
  { code: "it",   native: "Italiano",     english: "Italian",           hreflang: "it"    },
  { code: "ja",   native: "日本語",        english: "Japanese",          hreflang: "ja"    },
  { code: "ko",   native: "한국어",        english: "Korean",            hreflang: "ko"    },
  { code: "lt",   native: "Lietuvių",     english: "Lithuanian",        hreflang: "lt"    },
  { code: "mk",   native: "Македонски",   english: "Macedonian",        hreflang: "mk"    },
  { code: "mn",   native: "Монгол",       english: "Mongolian",         hreflang: "mn"    },
  { code: "nl",   native: "Nederlands",   english: "Dutch",             hreflang: "nl"    },
  { code: "pl",   native: "Polski",       english: "Polish",            hreflang: "pl"    },
  { code: "ptBR", native: "Português (Brasil)", english: "Portuguese (Brazil)", hreflang: "pt-BR" },
  { code: "ro",   native: "Română",       english: "Romanian",          hreflang: "ro"    },
  { code: "ru",   native: "Русский",      english: "Russian",           hreflang: "ru"    },
  { code: "th",   native: "ไทย",          english: "Thai",              hreflang: "th"    },
  { code: "tr",   native: "Türkçe",       english: "Turkish",           hreflang: "tr"    },
  { code: "uk",   native: "Українська",   english: "Ukrainian",         hreflang: "uk"    },
  { code: "vi",   native: "Tiếng Việt",   english: "Vietnamese",        hreflang: "vi"    },
  { code: "zhCN", native: "简体中文",      english: "Chinese (Simplified)", hreflang: "zh-CN" },
]

export const DEFAULT_BLOG_LOCALE = "en"

export const BLOG_LOCALE_CODES = BLOG_LOCALES.map((l) => l.code)

export function findBlogLocale(code: string) {
  return BLOG_LOCALES.find((l) => l.code === code)
}
