import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { CategoryListTable } from "./components/category-list-table"

export const CategoryList = () => {
  const { getWidgets } = useExtension()
  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("blog_category.list.before"),
        after: getWidgets("blog_category.list.after"),
      }}
    >
      <CategoryListTable />
    </SingleColumnPage>
  )
}
