import { zodResolver } from "@hookform/resolvers/zod"
import { PencilSquare, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Table,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Form } from "../../../../components/common/form"
import {
  BlogTag,
  useBlogTags,
  useCreateBlogTag,
  useDeleteBlogTag,
  useUpdateBlogTag,
  useUpsertTagTranslation,
} from "../../../../hooks/api/blog"
import { DEFAULT_BLOG_LOCALE } from "../../../../lib/constants/blog-locales"
import { LocaleTabSwitcher } from "../../common/locale-tab-switcher"
import { SlugInput } from "../../common/slug-input"

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const COLOR_PATTERN = /^#?[0-9a-fA-F]{3,8}$/

const coreSchema = z.object({
  slug: z.string().min(1).regex(SLUG_PATTERN, "Invalid slug"),
  color: z
    .string()
    .optional()
    .refine(
      (v) => !v || COLOR_PATTERN.test(v),
      "Must be a hex color (e.g. #22c55e)"
    ),
})
type CoreValues = z.infer<typeof coreSchema>

const translationSchema = z.object({
  name: z.string().min(1),
})
type TranslationValues = z.infer<typeof translationSchema>

export function TagListTable() {
  const prompt = usePrompt()
  const { data, isError, error } = useBlogTags({ limit: 200 })
  if (isError) throw error

  const tags = data?.tags ?? []
  const [editing, setEditing] = useState<BlogTag | null>(null)
  const [creating, setCreating] = useState(false)
  const { mutateAsync: deleteTag } = useDeleteBlogTag()

  const handleDelete = async (id: string, slug: string) => {
    const ok = await prompt({
      title: "Delete tag",
      description: `Delete tag "${slug}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    })
    if (!ok) return
    try {
      await deleteTag(id)
      toast.success(`Deleted "${slug}"`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed"
      toast.error(msg)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Blog tags</Heading>
        <Button size="small" variant="primary" onClick={() => setCreating(true)}>
          Create tag
        </Button>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Slug</Table.HeaderCell>
            <Table.HeaderCell>Color</Table.HeaderCell>
            <Table.HeaderCell>Translations</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tags.map((t) => (
            <Table.Row key={t.id}>
              <Table.Cell className="font-medium">{t.slug}</Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  {t.color && (
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-ui-border-base"
                      style={{ backgroundColor: t.color }}
                    />
                  )}
                  <Text size="small" className="text-ui-fg-subtle">
                    {t.color ?? "—"}
                  </Text>
                </div>
              </Table.Cell>
              <Table.Cell>{(t.translations ?? []).length}</Table.Cell>
              <Table.Cell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => setEditing(t)}
                  >
                    <PencilSquare />
                  </Button>
                  <Button
                    variant="transparent"
                    size="small"
                    onClick={() => handleDelete(t.id, t.slug)}
                  >
                    <Trash />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
          {tags.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={4}>
                <div className="py-8 text-center text-ui-fg-subtle">
                  No tags yet.
                </div>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>

      {creating && <TagDrawer mode="create" onClose={() => setCreating(false)} />}
      {editing && (
        <TagDrawer mode="edit" tag={editing} onClose={() => setEditing(null)} />
      )}
    </Container>
  )
}

type DrawerProps =
  | { mode: "create"; tag?: never; onClose: () => void }
  | { mode: "edit"; tag: BlogTag; onClose: () => void }

function TagDrawer(props: DrawerProps) {
  const { mode, onClose } = props
  const tag = mode === "edit" ? props.tag : undefined

  const form = useForm<CoreValues>({
    defaultValues: { slug: tag?.slug ?? "", color: tag?.color ?? "" },
    resolver: zodResolver(coreSchema),
  })

  const { mutateAsync: createTag, isPending: creating } = useCreateBlogTag()
  const { mutateAsync: updateTag, isPending: updating } = useUpdateBlogTag(
    tag?.id ?? "disabled"
  )

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "create") {
        await createTag({
          slug: values.slug,
          color: values.color || null,
          translations: [{ locale: DEFAULT_BLOG_LOCALE, name: values.slug }],
        })
        toast.success("Tag created")
      } else {
        await updateTag({
          slug: values.slug,
          color: values.color || null,
        })
        toast.success("Tag updated")
      }
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed"
      toast.error(msg)
    }
  })

  return (
    <Drawer open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            {mode === "create" ? "Create tag" : "Edit tag"}
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          <Form {...form}>
            <form
              id="tag-core-form"
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
                name="color"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Color</Form.Label>
                    <Form.Control>
                      <div className="flex items-center gap-2">
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="#22c55e"
                        />
                        {field.value && COLOR_PATTERN.test(field.value) && (
                          <span
                            className="inline-block h-6 w-6 rounded-md border border-ui-border-base"
                            style={{ backgroundColor: field.value }}
                          />
                        )}
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </form>
          </Form>

          {mode === "edit" && tag && <TagTranslationsPanel tag={tag} />}
          {mode === "create" && (
            <Text size="small" className="text-ui-fg-subtle">
              After creating the tag you can add translations per locale.
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
              form="tag-core-form"
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

function TagTranslationsPanel({ tag }: { tag: BlogTag }) {
  const existing = tag.translations ?? []
  const translatedLocales = existing.map((t) => t.locale)
  const [activeLocale, setActiveLocale] = useState<string>(
    translatedLocales.includes(DEFAULT_BLOG_LOCALE)
      ? DEFAULT_BLOG_LOCALE
      : translatedLocales[0] ?? DEFAULT_BLOG_LOCALE
  )
  const current = existing.find((t) => t.locale === activeLocale)

  const form = useForm<TranslationValues>({
    defaultValues: { name: current?.name ?? "" },
    resolver: zodResolver(translationSchema),
  })

  useEffect(() => {
    form.reset({ name: current?.name ?? "" })
  }, [activeLocale, tag.id])

  const { mutateAsync, isPending } = useUpsertTagTranslation(tag.id, activeLocale)

  const save = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ name: values.name })
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
