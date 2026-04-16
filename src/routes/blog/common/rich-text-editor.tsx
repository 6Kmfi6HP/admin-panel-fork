import { IconButton, clx, toast, Tooltip } from "@medusajs/ui"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Typography from "@tiptap/extension-typography"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { generateHTML } from "@tiptap/html"
import { createLowlight, common as lowlightCommon } from "lowlight"
import { useCallback, useEffect, useMemo } from "react"

import { sdk } from "../../../lib/client"

const lowlight = createLowlight(lowlightCommon)

type RichTextEditorProps = {
  valueJson: unknown | null
  onChangeJson: (value: unknown) => void
  onChangeHtml?: (html: string) => void
  placeholder?: string
  className?: string
}

function buildExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      codeBlock: false,
    }),
    Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      protocols: ["https", "http", "mailto"],
    }),
    Image.configure({ inline: false, allowBase64: false }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Typography,
    CodeBlockLowlight.configure({ lowlight }),
  ]
}

/**
 * Serialize Tiptap JSON to HTML in the browser so the backend receives both
 * `content_json` (authoritative) and `content_html` (pre-rendered, storefront
 * can render without the Tiptap runtime). Backend re-sanitizes this HTML.
 */
export function renderTiptapHtml(json: unknown): string {
  if (!json) return ""
  try {
    return generateHTML(json as never, buildExtensions())
  } catch {
    return ""
  }
}

export function RichTextEditor({
  valueJson,
  onChangeJson,
  onChangeHtml,
  placeholder,
  className,
}: RichTextEditorProps) {
  const extensions = useMemo(
    () => buildExtensions(placeholder),
    [placeholder]
  )

  const editor = useEditor({
    extensions,
    content: valueJson ?? "",
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChangeJson(json)
      if (onChangeHtml) onChangeHtml(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[240px] max-h-[600px] overflow-auto rounded-b-lg border-t border-ui-border-base px-4 py-3 prose prose-sm max-w-none focus:outline-none",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getJSON()
    if (JSON.stringify(current) === JSON.stringify(valueJson ?? "")) return
    editor.commands.setContent(valueJson ?? "", { emitUpdate: false })
  }, [valueJson, editor])

  if (!editor) return null

  return (
    <div
      className={clx(
        "rounded-lg border border-ui-border-base bg-ui-bg-base",
        className
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

// ----- Toolbar -------------------------------------------------------------

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Paste link URL (empty to unlink):", previousUrl ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const insertImage = useCallback(async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const fd = new FormData()
        fd.append("files", file, file.name)
        const res = await sdk.client.fetch<{
          files: Array<{ id: string; url: string }>
        }>("/admin/uploads", { method: "POST", body: fd })
        const url = res?.files?.[0]?.url
        if (!url) throw new Error("no url")
        editor.chain().focus().setImage({ src: url, alt: file.name }).run()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Image upload failed"
        toast.error(msg)
      }
    }
    input.click()
  }, [editor])

  const btn = (args: {
    label: string
    active?: boolean
    disabled?: boolean
    onClick: () => void
    children: React.ReactNode
  }) => (
    <Tooltip content={args.label}>
      <IconButton
        type="button"
        variant={args.active ? "primary" : "transparent"}
        size="small"
        onClick={args.onClick}
        disabled={args.disabled}
        aria-label={args.label}
      >
        {args.children}
      </IconButton>
    </Tooltip>
  )

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 rounded-t-lg bg-ui-bg-subtle">
      {btn({
        label: "Bold",
        active: editor.isActive("bold"),
        onClick: () => editor.chain().focus().toggleBold().run(),
        children: <span className="font-bold">B</span>,
      })}
      {btn({
        label: "Italic",
        active: editor.isActive("italic"),
        onClick: () => editor.chain().focus().toggleItalic().run(),
        children: <span className="italic">I</span>,
      })}
      {btn({
        label: "Strikethrough",
        active: editor.isActive("strike"),
        onClick: () => editor.chain().focus().toggleStrike().run(),
        children: <span className="line-through">S</span>,
      })}
      <Divider />
      {btn({
        label: "Heading 1",
        active: editor.isActive("heading", { level: 1 }),
        onClick: () =>
          editor.chain().focus().toggleHeading({ level: 1 }).run(),
        children: <span className="text-xs font-bold">H1</span>,
      })}
      {btn({
        label: "Heading 2",
        active: editor.isActive("heading", { level: 2 }),
        onClick: () =>
          editor.chain().focus().toggleHeading({ level: 2 }).run(),
        children: <span className="text-xs font-bold">H2</span>,
      })}
      {btn({
        label: "Heading 3",
        active: editor.isActive("heading", { level: 3 }),
        onClick: () =>
          editor.chain().focus().toggleHeading({ level: 3 }).run(),
        children: <span className="text-xs font-bold">H3</span>,
      })}
      <Divider />
      {btn({
        label: "Bulleted list",
        active: editor.isActive("bulletList"),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        children: <span>•</span>,
      })}
      {btn({
        label: "Numbered list",
        active: editor.isActive("orderedList"),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        children: <span>1.</span>,
      })}
      {btn({
        label: "Blockquote",
        active: editor.isActive("blockquote"),
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        children: <span>❝</span>,
      })}
      {btn({
        label: "Code block",
        active: editor.isActive("codeBlock"),
        onClick: () => editor.chain().focus().toggleCodeBlock().run(),
        children: <span className="font-mono text-xs">{"</>"}</span>,
      })}
      <Divider />
      {btn({
        label: "Link",
        active: editor.isActive("link"),
        onClick: setLink,
        children: <span>🔗</span>,
      })}
      {btn({
        label: "Image",
        onClick: insertImage,
        children: <span>🖼</span>,
      })}
      <Divider />
      {btn({
        label: "Align left",
        active: editor.isActive({ textAlign: "left" }),
        onClick: () => editor.chain().focus().setTextAlign("left").run(),
        children: <span>L</span>,
      })}
      {btn({
        label: "Align center",
        active: editor.isActive({ textAlign: "center" }),
        onClick: () => editor.chain().focus().setTextAlign("center").run(),
        children: <span>C</span>,
      })}
      {btn({
        label: "Align right",
        active: editor.isActive({ textAlign: "right" }),
        onClick: () => editor.chain().focus().setTextAlign("right").run(),
        children: <span>R</span>,
      })}
      <Divider />
      {btn({
        label: "Undo",
        onClick: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
        children: <span>↶</span>,
      })}
      {btn({
        label: "Redo",
        onClick: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
        children: <span>↷</span>,
      })}
    </div>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-ui-border-base mx-1" />
}
