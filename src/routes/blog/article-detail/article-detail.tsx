import { Heading, Text } from "@medusajs/ui"
import type { LoaderFunctionArgs } from "react-router-dom"
import { Link, useParams } from "react-router-dom"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useBlogArticle } from "../../../hooks/api/blog"
import { useExtension } from "../../../providers/extension-provider"
import { ArticleGeneralForm } from "./components/article-general-form"
import { ArticlePublishActions } from "./components/article-publish-actions"
import { ArticleTranslationsSection } from "./components/article-translations-section"

export const ArticleDetail = () => {
  const { id } = useParams()
  const { getWidgets } = useExtension()
  const { article, isLoading, isError, error } = useBlogArticle(id!)

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("blog_article.detail.before"),
        after: getWidgets("blog_article.detail.after"),
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center gap-x-2">
          <Link
            to="/blog"
            className="text-ui-fg-subtle hover:text-ui-fg-base text-sm"
          >
            Blog
          </Link>
          <span className="text-ui-fg-muted">/</span>
          <Text size="small" weight="plus">
            {article?.slug ?? id}
          </Text>
        </div>

        {isLoading && !article && (
          <div className="py-12 text-center text-ui-fg-subtle">Loading…</div>
        )}

        {article && (
          <>
            <Heading level="h1">
              {pickHeading(article.translations ?? [], article.slug)}
            </Heading>

            <ArticlePublishActions article={article} />
            <ArticleGeneralForm article={article} />
            <ArticleTranslationsSection article={article} />
          </>
        )}
      </div>
    </SingleColumnPage>
  )
}

function pickHeading(
  translations: { locale: string; title: string }[],
  fallback: string
): string {
  const en = translations.find((t) => t.locale === "en")
  return (en?.title || translations[0]?.title || fallback || "").trim()
}

export async function loader(_args: LoaderFunctionArgs) {
  // Data is fetched inside the component via react-query; the loader is a
  // placeholder so React Router can still wire up breadcrumbs/route typing.
  return null
}
