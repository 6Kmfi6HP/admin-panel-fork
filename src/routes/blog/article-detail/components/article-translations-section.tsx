import { useCallback, useMemo, useState } from 'react';

import { Container, Heading } from '@medusajs/ui';

import { BlogArticle } from '../../../../hooks/api/blog';
import { DEFAULT_BLOG_LOCALE } from '../../../../lib/constants/blog-locales';
import { LocaleTabSwitcher } from '../../common/locale-tab-switcher';
import { ArticleTranslationForm } from './article-translation-form';

type Props = {
  article: BlogArticle;
};

export function ArticleTranslationsSection({ article }: Props) {
  const translations = article.translations ?? [];

  const translatedLocales = useMemo(() => translations.map(t => t.locale), [translations]);

  const [activeLocale, setActiveLocale] = useState<string>(() => {
    if (translatedLocales.includes(DEFAULT_BLOG_LOCALE)) return DEFAULT_BLOG_LOCALE;
    return translatedLocales[0] ?? DEFAULT_BLOG_LOCALE;
  });

  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});

  const activeTranslation = translations.find(t => t.locale === activeLocale);

  const dirtyLocales = useMemo(
    () =>
      Object.entries(dirtyMap)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [dirtyMap]
  );

  // NOTE: handlers MUST be stable references. The child form effect pushes
  // `isDirty` to us and used to include `onDirtyChange` in its deps; when we
  // passed a fresh function every render the effect kept refiring, each call
  // produced a new object in setDirtyMap, re-rendered us, and so on — React
  // error #185 ("Maximum update depth exceeded"). useCallback + guarded
  // setState breaks the loop cleanly.
  const handleDirtyChange = useCallback(
    (dirty: boolean) => {
      setDirtyMap(prev => {
        if (!!prev[activeLocale] === dirty) return prev;
        return { ...prev, [activeLocale]: dirty };
      });
    },
    [activeLocale]
  );

  const handleSaved = useCallback((locale: string) => {
    setDirtyMap(prev => {
      if (!prev[locale]) return prev;
      return { ...prev, [locale]: false };
    });
  }, []);

  return (
    <Container className="flex flex-col gap-y-6 p-6">
      <div>
        <Heading level="h2">Translations</Heading>
      </div>

      <LocaleTabSwitcher
        activeLocale={activeLocale}
        onChange={setActiveLocale}
        translatedLocales={translatedLocales}
        dirtyLocales={dirtyLocales}
      />

      {/* Re-mount form per active locale so reset + dirty tracking are clean */}
      <ArticleTranslationForm
        key={activeLocale}
        articleId={article.id}
        locale={activeLocale}
        translation={activeTranslation}
        onDirtyChange={handleDirtyChange}
        onSaved={handleSaved}
      />
    </Container>
  );
}
