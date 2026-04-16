import { useEffect, useRef } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Heading, Input, Label, Textarea, toast } from '@medusajs/ui';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Form } from '../../../../components/common/form';
import { BlogTranslation, useUpsertArticleTranslation } from '../../../../hooks/api/blog';
import { renderTiptapHtml, RichTextEditor } from '../../common/rich-text-editor';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  excerpt: z.string().optional(),
  content_json: z.unknown().nullable().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  cover_image_alt: z.string().optional()
});

type Values = z.infer<typeof schema>;

type Props = {
  articleId: string;
  locale: string;
  translation?: BlogTranslation;
  onDirtyChange?: (dirty: boolean) => void;
  onSaved?: (locale: string) => void;
};

export function ArticleTranslationForm({
  articleId,
  locale,
  translation,
  onDirtyChange,
  onSaved
}: Props) {
  const form = useForm<Values>({
    defaultValues: buildDefaults(translation),
    resolver: zodResolver(schema)
  });

  // NOTE: The parent remounts this component via `key={activeLocale}` when the
  // user switches locale, so `defaultValues` already captures the right initial
  // state. A reset effect that depends on `translation` would re-run every time
  // the parent re-renders (the `.find()` in parent returns a new reference each
  // render) and would blow away user edits — classic React error #185.
  // If react-query later refetches and we need to re-sync, prefer an explicit
  // refresh button over an auto-reset.

  // Push isDirty to parent WITHOUT depending on the callback's identity — the
  // parent recreates the handler on every render, and including it in the deps
  // array caused an infinite update loop (React error #185).
  const onDirtyChangeRef = useRef(onDirtyChange);
  useEffect(() => {
    onDirtyChangeRef.current = onDirtyChange;
  });
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    onDirtyChangeRef.current?.(isDirty);
  }, [isDirty]);

  const { mutateAsync, isPending } = useUpsertArticleTranslation(articleId, locale);

  const contentJson = form.watch('content_json') ?? null;

  const onSubmit = form.handleSubmit(async values => {
    const contentHtml = values.content_json ? renderTiptapHtml(values.content_json) : null;
    try {
      await mutateAsync({
        title: values.title,
        subtitle: values.subtitle || null,
        excerpt: values.excerpt || null,
        content_json: values.content_json ?? null,
        content_html: contentHtml,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        seo_keywords: values.seo_keywords || null,
        cover_image_alt: values.cover_image_alt || null
      });
      toast.success(`Translation (${locale}) saved`);
      form.reset(values);
      onSaved?.(locale);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      toast.error(msg);
    }
  });

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-y-5"
      >
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
            onChangeJson={j => form.setValue('content_json', j, { shouldDirty: true })}
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
        <Form.Field
          control={form.control}
          name="cover_image_alt"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Cover image alt text</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  value={field.value ?? ''}
                />
              </Form.Control>
            </Form.Item>
          )}
        />

        <div className="flex justify-end gap-x-2">
          <Button
            type="submit"
            size="small"
            isLoading={isPending}
          >
            Save translation
          </Button>
        </div>
      </form>
    </Form>
  );
}

function buildDefaults(translation?: BlogTranslation): Values {
  return {
    title: translation?.title ?? '',
    subtitle: translation?.subtitle ?? '',
    excerpt: translation?.excerpt ?? '',
    content_json: translation?.content_json ?? null,
    seo_title: translation?.seo_title ?? '',
    seo_description: translation?.seo_description ?? '',
    seo_keywords: translation?.seo_keywords ?? '',
    cover_image_alt: translation?.cover_image_alt ?? ''
  };
}
