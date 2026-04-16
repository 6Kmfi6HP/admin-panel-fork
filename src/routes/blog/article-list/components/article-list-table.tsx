import { PencilSquare, Trash } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  Table,
  clx,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import {
  BlogArticle,
  useBlogArticles,
  useDeleteBlogArticle,
} from "../../../../hooks/api/blog"
import { DEFAULT_BLOG_LOCALE } from "../../../../lib/constants/blog-locales"

const PAGE_SIZE = 20

type StatusFilter = "all" | BlogArticle["status"]

function pickDisplayTitle(article: BlogArticle): string {
  const translations = article.translations ?? []
  const en = translations.find((t) => t.locale === DEFAULT_BLOG_LOCALE)
  return (en?.title || translations[0]?.title || article.slug || "").trim()
}

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}

function StatusBadge({ status }: { status: BlogArticle["status"] }) {
  const color: "green" | "grey" | "red" =
    status === "published" ? "green" : status === "archived" ? "red" : "grey"
  return (
    <Badge color={color} size="2xsmall" className="capitalize">
      {status}
    </Badge>
  )
}

export function ArticleListTable() {
  const navigate = useNavigate()
  const prompt = usePrompt()

  const [status, setStatus] = useState<StatusFilter>("all")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(0)

  const q = useDebounced(searchInput, 350)

  useEffect(() => {
    // Reset to page 0 when filters change
    setPage(0)
  }, [q, status])

  const { articles, count, isLoading, isError, error } = useBlogArticles(
    {
      q: q || undefined,
      status: status === "all" ? undefined : status,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      order: "-created_at",
    },
    { placeholderData: keepPreviousData }
  )

  if (isError) {
    throw error
  }

  const { mutateAsync: deleteArticle } = useDeleteBlogArticle()

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await prompt({
      title: "Delete article",
      description: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    })
    if (!confirmed) return
    await deleteArticle(id, {
      onSuccess: () => toast.success(`Deleted "${title}"`),
      onError: (e) => toast.error(e.message),
    })
  }

  const rows = articles ?? []
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
    [count]
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Blog articles</Heading>
        <Button size="small" variant="primary" asChild>
          <Link to="/blog/create">Create article</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-6 py-3">
        <Input
          className="max-w-xs"
          placeholder="Search title / slug..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <Select.Trigger className="w-44">
            <Select.Value placeholder="Status" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All statuses</Select.Item>
            <Select.Item value="draft">Draft</Select.Item>
            <Select.Item value="published">Published</Select.Item>
            <Select.Item value="archived">Archived</Select.Item>
          </Select.Content>
        </Select>
      </div>

      <div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Slug</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Categories</Table.HeaderCell>
              <Table.HeaderCell>Published at</Table.HeaderCell>
              <Table.HeaderCell className="w-20 text-right">
                Actions
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((article) => {
              const title = pickDisplayTitle(article) || "(untitled)"
              const cats = article.categories ?? []
              const publishedAt = article.published_at
                ? new Date(article.published_at).toLocaleString()
                : "—"
              return (
                <Table.Row
                  key={article.id}
                  className={clx("cursor-pointer hover:bg-ui-bg-base-hover")}
                  onClick={() => navigate(`/blog/${article.id}`)}
                >
                  <Table.Cell className="font-medium">{title}</Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle">
                    {article.slug}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={article.status} />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-1">
                      {cats.slice(0, 3).map((c) => (
                        <Badge key={c.id} size="2xsmall" color="blue">
                          {c.slug}
                        </Badge>
                      ))}
                      {cats.length > 3 && (
                        <Badge size="2xsmall" color="grey">
                          +{cats.length - 3}
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{publishedAt}</Table.Cell>
                  <Table.Cell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => navigate(`/blog/${article.id}`)}
                        aria-label="Edit"
                      >
                        <PencilSquare />
                      </Button>
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => handleDelete(article.id, title)}
                        aria-label="Delete"
                      >
                        <Trash />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
            {!isLoading && rows.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <div className="py-8 text-center text-ui-fg-subtle">
                    No articles found.
                  </div>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>

      <div className="flex items-center justify-between px-6 py-3 text-ui-fg-subtle text-sm">
        <span>
          {count ?? 0} result{(count ?? 0) === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="small"
            variant="secondary"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <Button
            size="small"
            variant="secondary"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Container>
  )
}
