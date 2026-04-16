import { useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Heading, Input, Label, Select, Switch, Text, Textarea, toast } from '@medusajs/ui';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';

import { Form } from '../../../components/common/form';
import { RouteFocusModal, useRouteModal } from '../../../components/modals';
import { KeyboundForm } from '../../../components/utilities/keybound-form';
import { useBlogCategories, useBlogTags, useCreateBlogArticle } from '../../../hooks/api/blog';
import { BLOG_LOCALES, DEFAULT_BLOG_LOCALE } from '../../../lib/constants/blog-locales';
import { ImageUploader } from '../common/image-uploader';
import { renderTiptapHtml, RichTextEditor } from '../common/rich-text-editor';
import { SlugInput } from '../common/slug-input';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CreateArticleSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(SLUG_PATTERN, 'Must be lowercase letters/numbers with hyphens'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_featured: z.boolean().default(false),
  cover_image_url: z.string().nullable().optional(),
  category_ids: z.array(z.string()).default([]),
  tag_ids: z.array(z.string()).default([]),
  locale: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  excerpt: z.string().optional(),
  content_json: z.unknown().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional()
});

type CreateArticleValues = z.infer<typeof CreateArticleSchema>;

const CreateArticleForm = () => {
  const navigate = useNavigate();
  const { handleSuccess } = useRouteModal();

  const form = useForm<CreateArticleValues>({
    defaultValues: {
      slug: '',
      status: 'draft',
      is_featured: false,
      cover_image_url: null,
      category_ids: [],
      tag_ids: [],
      locale: DEFAULT_BLOG_LOCALE,
      title: '',
      subtitle: '',
      excerpt: '',
      content_json: null,
      seo_title: '',
      seo_description: '',
      seo_keywords: ''
    },
    resolver: zodResolver(CreateArticleSchema)
  });

  const { data: categoriesData } = useBlogCategories({ limit: 200 });
  const { data: tagsData } = useBlogTags({ limit: 200 });

  const { mutateAsync, isPending } = useCreateBlogArticle();

  const titleValue = form.watch('title');
  const selectedCategoryIds = form.watch('category_ids') ?? [];
  const selectedTagIds = form.watch('tag_ids') ?? [];
  const contentJson = form.watch('content_json') ?? null;

  const categories = useMemo(() => categoriesData?.categories ?? [], [categoriesData]);
  const tags = useMemo(() => tagsData?.tags ?? [], [tagsData]);

  const toggleInArray = (current: string[], id: string, setter: (next: string[]) => void) => {
    setter(current.includes(id) ? current.filter(c => c !== id) : [...current, id]);
  };

  const handleSubmit = form.handleSubmit(async values => {
    const contentHtml = values.content_json ? renderTiptapHtml(values.content_json) : null;
    try {
      const res = await mutateAsync({
        slug: values.slug,
        status: values.status,
        is_featured: values.is_featured,
        cover_image_url: values.cover_image_url ?? null,
        category_ids: values.category_ids,
        tag_ids: values.tag_ids,
        translations: [
          {
            locale: values.locale,
            title: values.title,
            subtitle: values.subtitle || null,
            excerpt: values.excerpt || null,
            content_json: values.content_json ?? null,
            content_html: contentHtml,
            seo_title: values.seo_title || null,
            seo_description: values.seo_description || null,
            seo_keywords: values.seo_keywords || null
          }
        ]
      });
      toast.success('Article created');
      handleSuccess(`/blog/${res.article.id}`);
      navigate(`/blog/${res.article.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Create failed';
      toast.error(msg);
    }
  });

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col items-center overflow-y-auto pt-12">
          <div className="flex w-full max-w-[840px] flex-col gap-y-10 pb-10">
            <div className="flex flex-col gap-y-2">
              <RouteFocusModal.Title asChild>
                <Heading>Create blog article</Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text
                  size="small"
                  className="text-ui-fg-subtle"
                >
                  Start with the English version. You can add more languages after creation.
                </Text>
              </RouteFocusModal.Description>
            </div>

            {/* General section */}
            <section className="flex flex-col gap-y-5">
              <Heading level="h3">General</Heading>

              <Form.Field
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Control>
                      <SlugInput
                        value={field.value}
                        onChange={field.onChange}
                        sourceTitle={titleValue}
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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

              <Form.Field
                control={form.control}
                name="cover_image_url"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Control>
                      <ImageUploader
                        value={field.value ?? null}
                        onChange={url => field.onChange(url)}
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />

              <div className="flex flex-col gap-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.length === 0 && (
                    <Text
                      size="small"
                      className="text-ui-fg-subtle"
                    >
                      No categories yet.
                    </Text>
                  )}
                  {categories.map(c => {
                    const checked = selectedCategoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          toggleInArray(selectedCategoryIds, c.id, next =>
                            form.setValue('category_ids', next)
                          )
                        }
                        className={
                          checked
                            ? 'rounded-full border border-ui-border-interactive bg-ui-bg-interactive px-3 py-1 text-sm text-ui-fg-on-color'
                            : 'rounded-full border border-ui-border-base bg-ui-bg-base px-3 py-1 text-sm text-ui-fg-base hover:bg-ui-bg-base-hover'
                        }
                      >
                        {c.slug}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.length === 0 && (
                    <Text
                      size="small"
                      className="text-ui-fg-subtle"
                    >
                      No tags yet.
                    </Text>
                  )}
                  {tags.map(tag => {
                    const checked = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          toggleInArray(selectedTagIds, tag.id, next =>
                            form.setValue('tag_ids', next)
                          )
                        }
                        className={
                          checked
                            ? 'rounded-full border border-ui-border-interactive bg-ui-bg-interactive px-3 py-1 text-sm text-ui-fg-on-color'
                            : 'rounded-full border border-ui-border-base bg-ui-bg-base px-3 py-1 text-sm text-ui-fg-base hover:bg-ui-bg-base-hover'
                        }
                      >
                        {tag.slug}
                      </button>
                    );
                  })}
                </div>
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
            </section>

            {/* Initial translation section */}
            <section className="flex flex-col gap-y-5">
              <Heading level="h3">Initial translation</Heading>

              <Form.Field
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Locale</Form.Label>
                    <Form.Control>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <Select.Trigger className="w-60">
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {BLOG_LOCALES.map(l => (
                            <Select.Item
                              key={l.code}
                              value={l.code}
                            >
                              {l.code} — {l.native}
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
                name="title"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Title</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Subtitle</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Excerpt</Form.Label>
                    <Form.Control>
                      <Textarea
                        rows={3}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />

              <div className="flex flex-col gap-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  valueJson={contentJson}
                  onChangeJson={j => form.setValue('content_json', j)}
                />
              </div>

              <Heading
                level="h3"
                className="pt-4"
              >
                SEO
              </Heading>
              <Form.Field
                control={form.control}
                name="seo_title"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>SEO title</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                      />
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
                      <Textarea
                        rows={2}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="seo_keywords"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>SEO keywords</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />
            </section>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
              >
                Cancel
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              size="small"
              variant="primary"
              isLoading={isPending}
            >
              Create article
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

export const ArticleCreate = () => (
  <RouteFocusModal>
    <CreateArticleForm />
  </RouteFocusModal>
);
