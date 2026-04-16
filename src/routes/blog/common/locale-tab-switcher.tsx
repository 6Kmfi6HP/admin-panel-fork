import { Badge, clx } from "@medusajs/ui"

import { BLOG_LOCALES } from "../../../lib/constants/blog-locales"

type LocaleTabSwitcherProps = {
  activeLocale: string
  onChange: (locale: string) => void
  /** Locales that have a translation row in the DB. */
  translatedLocales?: string[]
  /** Locales that are dirty (unsaved changes) in the current form. */
  dirtyLocales?: string[]
}

/**
 * Horizontal, scrollable pill row for the 29 supported blog locales.
 * Shows a "Missing" badge for locales that have neither a saved translation
 * nor dirty in-memory data.
 */
export function LocaleTabSwitcher({
  activeLocale,
  onChange,
  translatedLocales = [],
  dirtyLocales = [],
}: LocaleTabSwitcherProps) {
  const translated = new Set(translatedLocales)
  const dirty = new Set(dirtyLocales)

  return (
    <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
      {BLOG_LOCALES.map((l) => {
        const isActive = l.code === activeLocale
        const hasTranslation = translated.has(l.code)
        const isDirty = dirty.has(l.code)
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => onChange(l.code)}
            className={clx(
              "inline-flex items-center gap-x-1.5 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                : "bg-ui-bg-base text-ui-fg-base border-ui-border-base hover:bg-ui-bg-base-hover"
            )}
            title={`${l.english} (${l.code})`}
          >
            <span className="font-medium">{l.code}</span>
            <span className="opacity-70">{l.native}</span>
            {isDirty && (
              <Badge size="2xsmall" color="orange">
                Unsaved
              </Badge>
            )}
            {!isDirty && !hasTranslation && (
              <Badge size="2xsmall" color="grey">
                Missing
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}
