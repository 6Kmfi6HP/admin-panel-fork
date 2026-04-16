import { zodResolver } from "@hookform/resolvers/zod"
import { PencilSquare, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Table,
  Text,
  Textarea,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Form } from "../../../../components/common/form"
import {
  BlogCategory,
  useBlogCategories,
  useCreateBlogCategory,
  useDeleteBlogCategory,
  useUpdateBlogCategory,
  useUpsertCategoryTranslation,
} from "../../../../hooks/api/blog"
import { DEFAULT_BLOG_LOCALE } from "../../../../lib/constants/blog-locales"
import { LocaleTabSwitcher } from "../../common/locale-tab-switcher"
import { SlugInput } from "../../common/slug-input"

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const coreSchema = z.object({
  slug: z.string().min(1).regex(SLUG_PATTERN, "Invalid slug"),
  parent_id: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
})

type CoreValues = z.infer<typeof coreSchema>

const translationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
})
type TranslationValues = z.infer<typeof translationSchema>

export function CategoryListTable() {
  const prompt = usePrompt()

  const { data, isError, error } = useBlogCategories({ limit: 200 })
  if (isError) throw error

  const categories = data?.categories ?? []
  const [editing, setEditing] = useState<BlogCategory | null>(null)
  const [creating, setCreating] = useState(false)

  const { mutateAsync: deleteCategory } = useDeleteBlogCategory()

  const handleDelete = async (id: string, slug: string) => {
    const ok = await prompt({
      title: "Delete category",
      description: `Delete category "${slug}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    })
    if (!ok) return
    try {
      await deleteCategory(id)
      toast.success(`Deleted "${slug}"`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed"
      toast.error(msg)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Blog categories</Heading>
        <Button size="small" variant="primary" onClick={() => setCreating(true)}>
          Create category
        </Button>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Slug</Table.HeaderCell>
            <Table.HeaderCell>Parent</Table.HeaderCell>
            <Table.HeaderCell>Sort</Table.HeaderCell>
            <Table.HeaderCell>Active</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {categories.map((c) => (
            <Table.Row key={c.id}>
              <Table.Cell className="font-medium">{c.slug}</Table.Cell>
              <Table.Cell>
                {categories.find((p) => p.id === c.parent_id)?.slug ?? "—"}
              </Table.Cell>
              <Table.Cell>{c.sort_order}</Table.Cell>
              <Table.Cell>{c.is_active ? "Yes" : "No"}</Table.Cell>
              <Table.Cell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => setEditing(c)}
                  >
                    <PencilSquare />
                  </Button>
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => handleDelete(c.id, c.slug)}
                  >
                    <Trash />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
          {categories.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={5}>
                <div className="py-8 text-center text-ui-fg-subtle">
                  No categories yet.
                </div>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      {creating && (
        <CategoryDrawer
          mode="create"
          allCategories={categories}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <CategoryDrawer
          mode="edit"
          category={editing}
          allCategories={categories}
          onClose={() => setEditing(null)}
        />
      )}
    </Container>
  )
}

type DrawerProps =
  | {
      mode: "create"
      category?: never
      allCategories: BlogCategory[]
      onClose: () => void
    }
  | {
      mode: "edit"
      category: BlogCategory
      allCategories: BlogCategory[]
      onClose: () => void
    }

function CategoryDrawer(props: DrawerProps) {
  const { mode, allCategories, onClose } = props
  const category = mode === "edit" ? props.category : undefined

  const form = useForm<CoreValues>({
    defaultValues: {
      slug: category?.slug ?? "",
      parent_id: category?.parent_id ?? null,
      sort_order: category?.sort_order ?? 0,
      is_active: category?.is_active ?? true,
    },
    resolver: zodResolver(coreSchema),
  })

  const { mutateAsync: createCategory, isPending: creating } =
    useCreateBlogCategory()
  const { mutateAsync: updateCategory, isPending: updating } =
    useUpdateBlogCategory(category?.id ?? "disabled")

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "create") {
        await createCategory({
          slug: values.slug,
          parent_id: values.parent_id ?? null,
          sort_order: values.sort_order,
          is_active: values.is_active,
          translations: [{ locale: DEFAULT_BLOG_LOCALE, name: values.slug }],
        })
        toast.success("Category created")
      } else {
        await updateCategory({
          slug: values.slug,
          parent_id: values.parent_id ?? null,
          sort_order: values.sort_order,
          is_active: values.is_active,
        })
        toast.success("Category updated")
      }
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed"
      toast.error(msg)
    }
  })

  const parentOptions = useMemo(
    () => allCategories.filter((c) => c.id !== category?.id),
    [allCategories, category]
  )

  return (
    <Drawer open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            {mode === "create" ? "Create category" : "Edit category"}
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          <Form {...form}>
            <form
              id="category-core-form"
              onSubmit={onSubmit}
              className="flex flex-col gap-y-4"
            >
              <Form.Field
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Control>
                      <SlugInput value={field.value} onChange={field.onChange} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Parent</Form.Label>
                    <Form.Control>
                      <Select
                        value={field.value ?? "__none__"}
                        onValueChange={(v) =>
                          field.onChange(v === "__none__" ? null : v)
                        }
                      >
                        <Select.Trigger>
                          <Select.Value placeholder="None" />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="__none__">None</Select.Item>
                          {parentOptions.map((p) => (
                            <Select.Item key={p.id} value={p.id}>
                              {p.slug}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Sort order</Form.Label>
                    <Form.Control>
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <Form.Item>
                    <div className="flex items-center justify-between">
                      <Form.Label>Active</Form.Label>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </Form.Item>
                )}
              />
            </form>
          </Form>

          {mode === "edit" && category && (
            <CategoryTranslationsPanel category={category} />
          )}
          {mode === "create" && (
            <Text size="small" className="text-ui-fg-subtle">
              After creating the category you can add translations per locale.
            </Text>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <Drawer.Close asChild>
              <Button size="small" variant="secondary">
                Cancel
              </Button>
            </Drawer.Close>
            <Button
              size="small"
              type="submit"
              form="category-core-form"
              isLoading={creating || updating}
            >
              Save
            </Button>
          </div>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

function CategoryTranslationsPanel({ category }: { category: BlogCategory }) {
  const existing = category.translations ?? []
  const translatedLocales = existing.map((t) => t.locale)
  const [activeLocale, setActiveLocale] = useState<string>(
    translatedLocales.includes(DEFAULT_BLOG_LOCALE)
      ? DEFAULT_BLOG_LOCALE
      : translatedLocales[0] ?? DEFAULT_BLOG_LOCALE
  )

  const current = existing.find((t) => t.locale === activeLocale)

  const form = useForm<TranslationValues>({
    defaultValues: {
      name: current?.name ?? "",
      description: current?.description ?? "",
      seo_title: current?.seo_title ?? "",
      seo_description: current?.seo_description ?? "",
    },
    resolver: zodResolver(translationSchema),
  })

  useEffect(() => {
    form.reset({
      name: current?.name ?? "",
      description: current?.description ?? "",
      seo_title: current?.seo_title ?? "",
      seo_description: current?.seo_description ?? "",
    })
  }, [activeLocale, category.id])

  const { mutateAsync, isPending } = useUpsertCategoryTranslation(
    category.id,
    activeLocale
  )

  const save = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({
        name: values.name,
        description: values.description || null,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
      })
      toast.success(`Translation (${activeLocale}) saved`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed"
      toast.error(msg)
    }
  })

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h3">Translations</Heading>
      <LocaleTabSwitcher
        activeLocale={activeLocale}
        onChange={setActiveLocale}
        translatedLocales={translatedLocales}
      />
      <Form {...form}>
        <form onSubmit={save} className="flex flex-col gap-y-3">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Name</Form.Label>
                <Form.Control>
                  <Input {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Description</Form.Label>
                <Form.Control>
                  <Textarea rows={2} {...field} value={field.value ?? ""} />
                </Form.Control>
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="seo_title"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>SEO title</Form.Label>
                <Form.Control>
                  <Input {...field} value={field.value ?? ""} />
                </Form.Control>
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="seo_description"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>SEO description</Form.Label>
                <Form.Control>
                  <Textarea rows={2} {...field} value={field.value ?? ""} />
                </Form.Control>
              </Form.Item>
            )}
          />
          <div className="flex justify-end">
            <Button size="small" type="submit" isLoading={isPending}>
              Save translation
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
