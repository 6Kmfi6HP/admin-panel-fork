import { Button, Label, Text, toast } from "@medusajs/ui"
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"

import { sdk } from "../../../lib/client"

type ImageUploaderProps = {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  hint?: string
  accept?: Record<string, string[]>
}

type UploadedFile = { id: string; url: string }

/**
 * Simple image uploader: drop or pick one image, POST to the built-in
 * Medusa `/admin/uploads` route, surface the returned URL back to the caller.
 */
export function ImageUploader({
  value,
  onChange,
  label = "Cover image",
  hint,
  accept = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
    "image/avif": [".avif"],
    "image/gif": [".gif"],
  },
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted?.[0]
      if (!file) return
      setUploading(true)
      try {
        const res = await sdk.client.fetch<{ files: UploadedFile[] }>(
          "/admin/uploads",
          {
            method: "POST",
            body: (() => {
              const fd = new FormData()
              fd.append("files", file, file.name)
              return fd
            })(),
          }
        )
        const url = res?.files?.[0]?.url
        if (!url) {
          throw new Error("Upload succeeded but no URL returned")
        }
        onChange(url)
        toast.success("Image uploaded")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        toast.error(msg)
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled: uploading,
  })

  return (
    <div className="flex flex-col gap-y-2">
      <Label>{label}</Label>

      {value ? (
        <div className="flex flex-col gap-y-2">
          <img
            src={value}
            alt=""
            className="max-h-40 w-full rounded-lg object-contain bg-ui-bg-subtle"
          />
          <div className="flex items-center gap-x-2">
            <Text size="small" className="truncate text-ui-fg-subtle">
              {value}
            </Text>
            <Button
              variant="secondary"
              size="small"
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className="flex cursor-pointer flex-col items-center justify-center gap-y-1 rounded-lg border-2 border-dashed border-ui-border-base p-6 hover:border-ui-border-interactive"
        >
          <input {...getInputProps()} />
          <Text size="small" weight="plus">
            {isDragActive
              ? "Drop the image here…"
              : uploading
              ? "Uploading…"
              : "Drag & drop an image, or click to pick"}
          </Text>
          {hint && (
            <Text size="xsmall" className="text-ui-fg-subtle">
              {hint}
            </Text>
          )}
        </div>
      )}
    </div>
  )
}
