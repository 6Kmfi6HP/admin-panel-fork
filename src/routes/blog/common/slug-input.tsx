import { Badge, Hint, Input, Label } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

import { useCheckArticleSlug } from "../../../hooks/api/blog"

type SlugInputProps = {
  value: string
  onChange: (value: string) => void
  sourceTitle?: string
  autoSlugify?: boolean
  excludeId?: string
  label?: string
  hint?: string
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 200)
}

/**
 * Slug input with:
 * - optional auto-derivation from the title
 * - debounced uniqueness check against the backend
 */
export function SlugInput({
  value,
  onChange,
  sourceTitle,
  autoSlugify = true,
  excludeId,
  label = "Slug",
  hint,
}: SlugInputProps) {
  const [touched, setTouched] = useState(false)

  // Auto-derive from title until the user manually edits the slug.
  useEffect(() => {
    if (!autoSlugify || touched || !sourceTitle) return
    const derived = slugify(sourceTitle)
    if (derived && derived !== value) {
      onChange(derived)
    }
  }, [sourceTitle, autoSlugify, touched, value, onChange])

  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), 350)
    return () => clearTimeout(h)
  }, [value])

  const slugPatternOk = useMemo(
    () => (value ? /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) : true),
    [value]
  )

  const { data, isFetching } = useCheckArticleSlug(debounced, excludeId, {
    enabled: Boolean(debounced) && slugPatternOk,
  })

  const available = data?.available

  return (
    <div className="flex flex-col gap-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => {
          setTouched(true)
          onChange(e.target.value.toLowerCase())
        }}
        placeholder="my-article-slug"
      />
      <div className="flex items-center gap-x-2">
        {!slugPatternOk && (
          <Hint variant="error">
            Must be lowercase with hyphens only (a-z, 0-9).
          </Hint>
        )}
        {slugPatternOk && isFetching && (
          <Hint>Checking availability…</Hint>
        )}
        {slugPatternOk && !isFetching && available === true && (
          <Badge color="green">Available</Badge>
        )}
        {slugPatternOk && !isFetching && available === false && (
          <Badge color="red">Already taken</Badge>
        )}
        {hint && <Hint>{hint}</Hint>}
      </div>
    </div>
  )
}

export { slugify }
