import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Container,
  Heading,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Form } from "../../../../components/common/form"
import {
  BlogArticle,
  useBlogCategories,
  useBlogTags,
  useUpdateBlogArticle,
} from "../../../../hooks/api/blog"
import { ImageUploader } from "../../common/image-uploader"
import { SlugInput } from "../../common/slug-input"

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const schema = z.object({
  slug: z.string().min(1).regex(SLUG_PATTERN, "Invalid slug pattern"),
  status: z.enum(["draft", "published", "archived"]),
  is_featured: z.boolean(),
  cover_image_url: z.string().nullable(),
  category_ids: z.array(z.string()),
  tag_ids: z.array(z.string()),
})

type Values = z.infer<typeof schema>

type Props = {
  article: BlogArticle
}

export function ArticleGeneralForm({ article }: Props) {
  const form = useForm<Values>({
    defaultValues: {
      slug: article.slug,
      status: article.status,
      is_featured: article.is_featured,
      cover_image_url: article.cover_image_url ?? null,
      category_ids: (article.categories ?? []).map((c) => c.id),
      tag_ids: (article.tags ?? []).map((t) => t.id),
    },
    resolver: zodResolver(schema),
  })

  const { data: categoriesData } = useBlogCategories({ limit: 200 })
  const { data: tagsData } = useBlogTags({ limit: 200 })
  const categories = useMemo(
    () => categoriesData?.categories ?? [],
    [categoriesData]
  )
  const tags = useMemo(() => tagsData?.tags ?? [], [tagsData])

  const { mutateAsync, isPending } = useUpdateBlogArticle(article.id)

  const selectedCategoryIds = form.watch("category_ids")
  const selectedTagIds = form.watch("tag_ids")
  const coverUrl = form.watch("cover_image_url")

  const toggle = (
    arr: string[],
    id: string,
    setter: (next: string[]) => void
  ) => {
    setter(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({
        slug: values.slug,
        status: values.status,
        is_featured: values.is_featured,
        cover_image_url: values.cover_image_url,
        category_ids: values.category_ids,
        tag_ids: values.tag_ids,
      })
      toast.success("Article saved")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed"
      toast.error(msg)
    }
  })

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between pb-4">
        <Heading level="h2">General</Heading>
      </div>
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-y-5">
          <Form.Field
            control={form.control}
            name="slug"
            render={({ field }) => (
              <Form.Item>
                <Form.Control>
                  <SlugInput
                    value={field.value}
                    onChange={field.onChange}
                    excludeId={article.id}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="status"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Status</Form.Label>
                <Form.Control>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <Select.Trigger className="w-60">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="draft">Draft</Select.Item>
                      <Select.Item value="published">Published</Select.Item>
                      <Select.Item value="archived">Archived</Select.Item>
                    </Select.Content>
                  </Select>
                </Form.Control>
              </Form.Item>
            )}
          />

          <div className="flex flex-col gap-y-2">
            <Label>Cover image</Label>
            <ImageUploader
              value={coverUrl}
              onChange={(url) => form.setValue("cover_image_url", url)}
            />
          </div>

          <Form.Field
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <Form.Item>
                <div className="flex items-center justify-between">
                  <Form.Label>Featured</Form.Label>
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </Form.Item>
            )}
          />

          <div className="flex flex-col gap-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && (
                <Text size="small" className="text-ui-fg-subtle">
                  No categories yet.
                </Text>
              )}
              {categories.map((c) => {
                const active = selectedCategoryIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      toggle(selectedCategoryIds, c.id, (next) =>
                        form.setValue("category_ids", next)
                      )
                    }
                    className={
                      active
                        ? "rounded-full border px-3 py-1 text-sm bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                        : "rounded-full border px-3 py-1 text-sm bg-ui-bg-base text-ui-fg-base border-ui-border-base hover:bg-ui-bg-base-hover"
                    }
                  >
                    {c.slug}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && (
                <Text size="small" className="text-ui-fg-subtle">
                  No tags yet.
                </Text>
              )}
              {tags.map((tag) => {
                const active = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      toggle(selectedTagIds, tag.id, (next) =>
                        form.setValue("tag_ids", next)
                      )
                    }
                    className={
                      active
                        ? "rounded-full border px-3 py-1 text-sm bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                        : "rounded-full border px-3 py-1 text-sm bg-ui-bg-base text-ui-fg-base border-ui-border-base hover:bg-ui-bg-base-hover"
                    }
                  >
                    {tag.slug}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="small" isLoading={isPending}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </Container>
  )
}
