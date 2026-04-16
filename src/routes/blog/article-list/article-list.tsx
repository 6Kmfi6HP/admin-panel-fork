import { Outlet } from "react-router-dom"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { ArticleListTable } from "./components/article-list-table"

export const ArticleList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("blog_article.list.before"),
        after: getWidgets("blog_article.list.after"),
      }}
    >
      <ArticleListTable />
      <Outlet />
    </SingleColumnPage>
  )
}
