import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { TagListTable } from "./components/tag-list-table"

export const TagList = () => {
  const { getWidgets } = useExtension()
  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("blog_tag.list.before"),
        after: getWidgets("blog_tag.list.after"),
      }}
    >
      <TagListTable />
    </SingleColumnPage>
  )
}
