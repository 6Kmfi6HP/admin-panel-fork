import { FetchError } from "@medusajs/js-sdk"
import {
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

// ----- Types ---------------------------------------------------------------

export type BlogTranslation = {
  id: string
  locale: string
  title: string
  subtitle: string | null
  excerpt: string | null
  content_json: unknown | null
  content_html: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  cover_image_alt: string | null
}

export type BlogCategoryTranslation = {
  id: string
  locale: string
  name: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
}

export type BlogTagTranslation = {
  id: string
  locale: string
  name: string
}

export type BlogCategory = {
  id: string
  slug: string
  parent_id: string | null
  sort_order: number
  is_active: boolean
  translations?: BlogCategoryTranslation[]
}

export type BlogTag = {
  id: string
  slug: string
  color: string | null
  translations?: BlogTagTranslation[]
}

export type BlogArticle = {
  id: string
  slug: string
  status: "draft" | "published" | "archived"
  published_at: string | null
  cover_image_url: string | null
  is_featured: boolean
  view_count: number
  reading_time_minutes: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  translations?: BlogTranslation[]
  categories?: BlogCategory[]
  tags?: BlogTag[]
}

// ----- Query keys ----------------------------------------------------------

const ARTICLES_QUERY_KEY = "blog_articles" as const
const CATEGORIES_QUERY_KEY = "blog_categories" as const
const TAGS_QUERY_KEY = "blog_tags" as const

export const blogArticlesQueryKeys = queryKeysFactory(ARTICLES_QUERY_KEY)
export const blogCategoriesQueryKeys = queryKeysFactory(CATEGORIES_QUERY_KEY)
export const blogTagsQueryKeys = queryKeysFactory(TAGS_QUERY_KEY)

// ----- Articles ------------------------------------------------------------

export type ListArticlesParams = {
  q?: string
  status?: BlogArticle["status"] | BlogArticle["status"][]
  is_featured?: boolean
  category_id?: string
  tag_id?: string
  limit?: number
  offset?: number
  order?: string
}

type ListArticlesResponse = {
  articles: BlogArticle[]
  count: number
  limit: number
  offset: number
}

export const useBlogArticles = (
  query?: ListArticlesParams,
  options?: Omit<
    UseQueryOptions<ListArticlesResponse, FetchError, ListArticlesResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: blogArticlesQueryKeys.list(query ?? {}),
    queryFn: () =>
      sdk.client.fetch<ListArticlesResponse>("/admin/blog/articles", {
        method: "GET",
        query: query as Record<string, string | number | boolean | undefined>,
      }),
    ...options,
  })
  return { ...data, ...rest }
}

export const useBlogArticle = (
  id: string,
  options?: Omit<
    UseQueryOptions<{ article: BlogArticle }, FetchError, { article: BlogArticle }, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: blogArticlesQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch<{ article: BlogArticle }>(
        `/admin/blog/articles/${id}`,
        { method: "GET" }
      ),
    ...options,
  })
  return { ...data, ...rest }
}

export type CreateArticlePayload = {
  slug: string
  status?: BlogArticle["status"]
  published_at?: string | null
  cover_image_url?: string | null
  is_featured?: boolean
  reading_time_minutes?: number | null
  metadata?: Record<string, unknown> | null
  category_ids?: string[]
  tag_ids?: string[]
  translations: Array<{
    locale: string
    title: string
    subtitle?: string | null
    excerpt?: string | null
    content_json?: unknown
    content_html?: string | null
    seo_title?: string | null
    seo_description?: string | null
    seo_keywords?: string | null
    cover_image_alt?: string | null
  }>
}

export const useCreateBlogArticle = (
  options?: UseMutationOptions<{ article: BlogArticle }, FetchError, CreateArticlePayload>
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ article: BlogArticle }>("/admin/blog/articles", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export type UpdateArticlePayload = Partial<
  Omit<CreateArticlePayload, "translations">
>

export const useUpdateBlogArticle = (
  id: string,
  options?: UseMutationOptions<{ article: BlogArticle }, FetchError, UpdateArticlePayload>
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ article: BlogArticle }>(
        `/admin/blog/articles/${id}`,
        { method: "PATCH", body: payload }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: blogArticlesQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useDeleteBlogArticle = (
  options?: UseMutationOptions<{ id: string; deleted: boolean }, FetchError, string>
) =>
  useMutation({
    mutationFn: (id) =>
      sdk.client.fetch<{ id: string; deleted: boolean }>(
        `/admin/blog/articles/${id}`,
        { method: "DELETE" }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const usePublishBlogArticle = (
  id: string,
  options?: UseMutationOptions<
    { article: BlogArticle },
    FetchError,
    { action: "publish" | "unpublish" | "archive"; published_at?: string | null }
  >
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ article: BlogArticle }>(
        `/admin/blog/articles/${id}/publish`,
        { method: "POST", body: payload }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogArticlesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: blogArticlesQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export type UpsertTranslationPayload = Omit<
  CreateArticlePayload["translations"][number],
  "locale"
>

export const useUpsertArticleTranslation = (
  articleId: string,
  locale: string,
  options?: UseMutationOptions<
    { translation: BlogTranslation },
    FetchError,
    UpsertTranslationPayload
  >
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ translation: BlogTranslation }>(
        `/admin/blog/articles/${articleId}/translations/${locale}`,
        { method: "PUT", body: payload }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: blogArticlesQueryKeys.detail(articleId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useDeleteArticleTranslation = (
  articleId: string,
  options?: UseMutationOptions<{ id: string; deleted: boolean }, FetchError, string>
) =>
  useMutation({
    mutationFn: (locale) =>
      sdk.client.fetch<{ id: string; deleted: boolean }>(
        `/admin/blog/articles/${articleId}/translations/${locale}`,
        { method: "DELETE" }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: blogArticlesQueryKeys.detail(articleId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useCheckArticleSlug = (
  slug: string,
  excludeId?: string,
  options?: Omit<
    UseQueryOptions<
      { slug: string; available: boolean },
      FetchError,
      { slug: string; available: boolean },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) =>
  useQuery({
    queryKey: blogArticlesQueryKeys.detail(`check-slug:${slug}:${excludeId ?? ""}`),
    queryFn: () =>
      sdk.client.fetch<{ slug: string; available: boolean }>(
        "/admin/blog/articles/check-slug",
        {
          method: "GET",
          query: {
            slug,
            ...(excludeId ? { exclude_id: excludeId } : {}),
          },
        }
      ),
    enabled: Boolean(slug),
    ...options,
  })

// ----- Categories ----------------------------------------------------------

type ListCategoriesResponse = {
  categories: BlogCategory[]
  count: number
  limit: number
  offset: number
}

export const useBlogCategories = (
  query?: {
    q?: string
    parent_id?: string | null
    is_active?: boolean
    limit?: number
    offset?: number
  },
  options?: Omit<
    UseQueryOptions<ListCategoriesResponse, FetchError, ListCategoriesResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) =>
  useQuery({
    queryKey: blogCategoriesQueryKeys.list(query ?? {}),
    queryFn: () =>
      sdk.client.fetch<ListCategoriesResponse>("/admin/blog/categories", {
        method: "GET",
        query: query as Record<string, string | number | boolean | undefined>,
      }),
    ...options,
  })

export const useBlogCategory = (id: string) =>
  useQuery({
    queryKey: blogCategoriesQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch<{ category: BlogCategory }>(
        `/admin/blog/categories/${id}`,
        { method: "GET" }
      ),
  })

export type CreateCategoryPayload = {
  slug: string
  parent_id?: string | null
  sort_order?: number
  is_active?: boolean
  translations: Array<{
    locale: string
    name: string
    description?: string | null
    seo_title?: string | null
    seo_description?: string | null
  }>
}

export const useCreateBlogCategory = (
  options?: UseMutationOptions<{ category: BlogCategory }, FetchError, CreateCategoryPayload>
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ category: BlogCategory }>("/admin/blog/categories", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogCategoriesQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useUpdateBlogCategory = (
  id: string,
  options?: UseMutationOptions<
    { category: BlogCategory },
    FetchError,
    Partial<Omit<CreateCategoryPayload, "translations">>
  >
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ category: BlogCategory }>(
        `/admin/blog/categories/${id}`,
        { method: "PATCH", body: payload }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogCategoriesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: blogCategoriesQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useDeleteBlogCategory = (
  options?: UseMutationOptions<{ id: string; deleted: boolean }, FetchError, string>
) =>
  useMutation({
    mutationFn: (id) =>
      sdk.client.fetch<{ id: string; deleted: boolean }>(
        `/admin/blog/categories/${id}`,
        { method: "DELETE" }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogCategoriesQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useUpsertCategoryTranslation = (
  categoryId: string,
  locale: string,
  options?: UseMutationOptions<
    { translation: BlogCategoryTranslation },
    FetchError,
    { name: string; description?: string | null; seo_title?: string | null; seo_description?: string | null }
  >
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ translation: BlogCategoryTranslation }>(
        `/admin/blog/categories/${categoryId}/translations/${locale}`,
        { method: "PUT", body: payload }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: blogCategoriesQueryKeys.detail(categoryId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

// ----- Tags ----------------------------------------------------------------

type ListTagsResponse = {
  tags: BlogTag[]
  count: number
  limit: number
  offset: number
}

export const useBlogTags = (
  query?: { q?: string; limit?: number; offset?: number },
  options?: Omit<
    UseQueryOptions<ListTagsResponse, FetchError, ListTagsResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) =>
  useQuery({
    queryKey: blogTagsQueryKeys.list(query ?? {}),
    queryFn: () =>
      sdk.client.fetch<ListTagsResponse>("/admin/blog/tags", {
        method: "GET",
        query: query as Record<string, string | number | boolean | undefined>,
      }),
    ...options,
  })

export type CreateTagPayload = {
  slug: string
  color?: string | null
  translations: Array<{ locale: string; name: string }>
}

export const useCreateBlogTag = (
  options?: UseMutationOptions<{ tag: BlogTag }, FetchError, CreateTagPayload>
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ tag: BlogTag }>("/admin/blog/tags", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogTagsQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useUpdateBlogTag = (
  id: string,
  options?: UseMutationOptions<
    { tag: BlogTag },
    FetchError,
    Partial<Omit<CreateTagPayload, "translations">>
  >
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ tag: BlogTag }>(`/admin/blog/tags/${id}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogTagsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: blogTagsQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useDeleteBlogTag = (
  options?: UseMutationOptions<{ id: string; deleted: boolean }, FetchError, string>
) =>
  useMutation({
    mutationFn: (id) =>
      sdk.client.fetch<{ id: string; deleted: boolean }>(
        `/admin/blog/tags/${id}`,
        { method: "DELETE" }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: blogTagsQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })

export const useUpsertTagTranslation = (
  tagId: string,
  locale: string,
  options?: UseMutationOptions<
    { translation: BlogTagTranslation },
    FetchError,
    { name: string }
  >
) =>
  useMutation({
    mutationFn: (payload) =>
      sdk.client.fetch<{ translation: BlogTagTranslation }>(
        `/admin/blog/tags/${tagId}/translations/${locale}`,
        { method: "PUT", body: payload }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: blogTagsQueryKeys.detail(tagId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
