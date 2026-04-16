import { Button, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"

import {
  BlogArticle,
  useDeleteBlogArticle,
  usePublishBlogArticle,
} from "../../../../hooks/api/blog"

type Props = {
  article: BlogArticle
}

export function ArticlePublishActions({ article }: Props) {
  const navigate = useNavigate()
  const prompt = usePrompt()

  const { mutateAsync: publish, isPending: publishing } =
    usePublishBlogArticle(article.id)
  const { mutateAsync: remove, isPending: deleting } = useDeleteBlogArticle()

  const isPublished = article.status === "published"
  const isArchived = article.status === "archived"

  const run = async (
    action: "publish" | "unpublish" | "archive",
    successMsg: string
  ) => {
    try {
      await publish({ action })
      toast.success(successMsg)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed"
      toast.error(msg)
    }
  }

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Delete article",
      description: `This will permanently delete the article and all its translations. Continue?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    })
    if (!confirmed) return
    try {
      await remove(article.id)
      toast.success("Article deleted")
      navigate("/blog")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed"
      toast.error(msg)
    }
  }

  return (
    <Container className="flex flex-col gap-y-4 p-6">
      <Heading level="h2">Status</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        Current status:{" "}
        <span className="font-medium capitalize text-ui-fg-base">
          {article.status}
        </span>
      </Text>
      <div className="flex flex-wrap gap-2">
        <Button
          size="small"
          variant="primary"
          disabled={isPublished || publishing}
          isLoading={publishing && !isArchived}
          onClick={() => run("publish", "Article published")}
        >
          Publish
        </Button>
        <Button
          size="small"
          variant="secondary"
          disabled={!isPublished || publishing}
          onClick={() => run("unpublish", "Article unpublished")}
        >
          Unpublish
        </Button>
        <Button
          size="small"
          variant="secondary"
          disabled={isArchived || publishing}
          onClick={() => run("archive", "Article archived")}
        >
          Archive
        </Button>
        <Button
          size="small"
          variant="danger"
          onClick={handleDelete}
          isLoading={deleting}
        >
          Delete
        </Button>
      </div>
    </Container>
  )
}
