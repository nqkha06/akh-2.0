"use client";

import { Image as TiptapImage } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import {
  EditorContent,
  type JSONContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Code,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import * as React from "react";

import { AdminMediaPicker } from "@/components/admin-media/admin-media-picker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: Record<string, unknown>;
  onChange: (value: {
    json: Record<string, unknown>;
    html: string;
  }) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TiptapImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full rounded-lg border",
        },
      }),
      Placeholder.configure({
        placeholder: "Bắt đầu viết nội dung trang...",
      }),
    ],
    content: value as JSONContent,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-96 px-5 py-4 text-sm leading-7 outline-none " +
          "[&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold " +
          "[&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold " +
          "[&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold " +
          "[&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold " +
          "[&_p]:mb-3 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 " +
          "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 " +
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 " +
          "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 " +
          "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 " +
          "[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2 " +
          "[&_a]:text-primary [&_a]:underline [&_img]:my-4 [&_hr]:my-6 " +
          "[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left " +
          "[&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground " +
          "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange({
        json: current.getJSON() as Record<string, unknown>,
        html: current.getHTML(),
      });
    },
  });

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-96 animate-pulse rounded-lg border bg-muted/30",
          className,
        )}
      />
    );
  }

  function setLink() {
    const previous = editor?.getAttributes("link").href as string | undefined;
    const href = window.prompt("Nhập URL liên kết", previous || "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: href.trim(), target: "_blank" })
      .run();
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-background",
          disabled && "opacity-70",
          className,
        )}
      >
        <div className="flex max-h-32 flex-wrap items-center gap-1 overflow-y-auto border-b bg-muted/20 p-2">
          <EditorButton
            label="Hoàn tác"
            disabled={!editor.can().chain().focus().undo().run()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 />
          </EditorButton>
          <EditorButton
            label="Làm lại"
            disabled={!editor.can().chain().focus().redo().run()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 />
          </EditorButton>
          <ToolbarSeparator />
          {([1, 2, 3, 4] as const).map((level) => {
            const Icon = [Heading1, Heading2, Heading3, Heading4][level - 1]!;
            return (
              <EditorButton
                key={level}
                label={`Heading ${level}`}
                active={editor.isActive("heading", { level })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level }).run()
                }
              >
                <Icon />
              </EditorButton>
            );
          })}
          <EditorButton
            label="Đoạn văn"
            active={editor.isActive("paragraph")}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <Braces />
          </EditorButton>
          <ToolbarSeparator />
          <EditorButton
            label="In đậm"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold />
          </EditorButton>
          <EditorButton
            label="In nghiêng"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </EditorButton>
          <EditorButton
            label="Gạch chân"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline />
          </EditorButton>
          <EditorButton
            label="Gạch ngang"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough />
          </EditorButton>
          <EditorButton
            label="Inline code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code />
          </EditorButton>
          <ToolbarSeparator />
          <EditorButton
            label="Danh sách"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List />
          </EditorButton>
          <EditorButton
            label="Danh sách đánh số"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
          </EditorButton>
          <EditorButton
            label="Task list"
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListChecks />
          </EditorButton>
          <EditorButton
            label="Trích dẫn"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
          </EditorButton>
          <EditorButton
            label="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Braces />
          </EditorButton>
          <EditorButton
            label="Đường phân cách"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus />
          </EditorButton>
          <ToolbarSeparator />
          <EditorButton
            label="Thêm liên kết"
            active={editor.isActive("link")}
            onClick={setLink}
          >
            <Link2 />
          </EditorButton>
          <EditorButton
            label="Bỏ liên kết"
            disabled={!editor.isActive("link")}
            onClick={() =>
              editor.chain().focus().extendMarkRange("link").unsetLink().run()
            }
          >
            <Unlink />
          </EditorButton>
          <EditorButton
            label="Thêm ảnh từ Media Manager"
            onClick={() => setImagePickerOpen(true)}
          >
            <ImagePlus />
          </EditorButton>
          <ToolbarSeparator />
          {[
            ["left", AlignLeft, "Căn trái"],
            ["center", AlignCenter, "Căn giữa"],
            ["right", AlignRight, "Căn phải"],
            ["justify", AlignJustify, "Căn đều"],
          ].map(([alignment, Icon, label]) => (
            <EditorButton
              key={alignment as string}
              label={label as string}
              active={editor.isActive({ textAlign: alignment as string })}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setTextAlign(alignment as string)
                  .run()
              }
            >
              {React.createElement(Icon as React.ComponentType)}
            </EditorButton>
          ))}
          <ToolbarSeparator />
          <EditorButton
            label="Xóa định dạng"
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <Eraser />
          </EditorButton>
        </div>
        <EditorContent editor={editor} />
      </div>

      <AdminMediaPicker
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        title="Chèn ảnh vào nội dung"
        onSelect={(file) => {
          editor
            .chain()
            .focus()
            .setImage({
              src: file.url,
              alt: file.altText || file.fileName,
              title: file.fileName,
            })
            .run();
        }}
      />
    </TooltipProvider>
  );
}

function EditorButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "ghost"}
          size="icon-sm"
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-1 h-6" />;
}
