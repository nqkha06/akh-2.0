import { cn } from "@/lib/utils"

type FileLike = {
  name?: string | null
  originalName?: string | null
  extension?: string | null
  mimeType?: string | null
  type?: string | null
}

export type FileTypeIconProps = {
  file: FileLike
  className?: string
  iconClassName?: string
}

const ICONS_BASE_PATH = "/file-icons"

const extensionIcons: Record<string, string> = {
  "7z": "zip",
  ai: "image",
  apk: "android",
  avi: "video",
  avif: "image",
  bat: "console",
  bin: "hex",
  bmp: "image",
  bz: "zip",
  bz2: "zip",
  c: "c",
  cjs: "javascript",
  cpp: "cpp",
  cs: "csharp",
  css: "css",
  csv: "table",
  dart: "dart",
  deb: "zip",
  dll: "dll",
  dmg: "disc",
  doc: "word",
  docm: "word",
  docx: "word",
  dot: "word",
  dotx: "word",
  epub: "document",
  exe: "exe",
  flac: "audio",
  gif: "image",
  go: "go",
  gz: "zip",
  heic: "image",
  html: "html",
  ico: "image",
  iso: "disc",
  jar: "jar",
  java: "java",
  jpeg: "image",
  jpg: "image",
  js: "javascript",
  json: "json",
  jsx: "react",
  kt: "kotlin",
  less: "less",
  lock: "lock",
  m4a: "audio",
  m4v: "video",
  md: "markdown",
  mjs: "javascript",
  mkv: "video",
  mov: "video",
  mp3: "audio",
  mp4: "video",
  mpeg: "video",
  msi: "exe",
  odp: "powerpoint",
  ods: "table",
  odt: "word",
  ogg: "audio",
  otf: "font",
  pdf: "pdf",
  php: "php",
  png: "image",
  pot: "powerpoint",
  potx: "powerpoint",
  pps: "powerpoint",
  ppsx: "powerpoint",
  ppt: "powerpoint",
  pptm: "powerpoint",
  pptx: "powerpoint",
  psd: "image",
  py: "python",
  rar: "zip",
  rb: "ruby",
  rpm: "zip",
  rtf: "word",
  sass: "sass",
  scss: "sass",
  sh: "console",
  sql: "database",
  svg: "svg",
  tar: "zip",
  tgz: "zip",
  tif: "image",
  tiff: "image",
  toml: "settings",
  ts: "typescript",
  tsx: "react_ts",
  tsv: "table",
  ttf: "font",
  txt: "document",
  vue: "vue",
  wav: "audio",
  webm: "video",
  webp: "image",
  wma: "audio",
  wmv: "video",
  woff: "font",
  woff2: "font",
  xls: "table",
  xlsb: "table",
  xlsm: "table",
  xlsx: "table",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  zip: "zip",
}

function normalizeExtension(file: FileLike) {
  const explicitExtension = file.extension
    ?.trim()
    .replace(/^\./, "")
    .toLowerCase()

  if (explicitExtension) return explicitExtension

  const fileName = file.name || file.originalName || ""
  const finalSegment = fileName.split("/").pop() || ""
  const separatorIndex = finalSegment.lastIndexOf(".")

  return separatorIndex > 0
    ? finalSegment.slice(separatorIndex + 1).toLowerCase()
    : ""
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (mimeType.startsWith("font/")) return "font"
  if (mimeType === "application/pdf") return "pdf"
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("compressed") ||
    mimeType.includes("tar")
  ) {
    return "zip"
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return "table"
  }
  if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint")
  ) {
    return "powerpoint"
  }
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.startsWith("text/")
  ) {
    return "document"
  }

  return "file"
}

export function getMaterialFileIcon(file: FileLike) {
  const extension = normalizeExtension(file)

  if (extension && extensionIcons[extension]) {
    return extensionIcons[extension]
  }

  return getMimeIcon((file.mimeType || file.type || "").toLowerCase())
}

export function FileTypeIcon({
  file,
  className,
  iconClassName,
}: FileTypeIconProps) {
  const iconName = getMaterialFileIcon(file)
  const extension = normalizeExtension(file)
  const label = extension
    ? `File ${extension.toUpperCase()}`
    : "File"

  return (
    <span
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden",
        className,
      )}
      role="img"
      aria-label={label}
      title={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ICONS_BASE_PATH}/${iconName}.svg`}
        alt=""
        aria-hidden="true"
        className={cn("size-10 object-contain", iconClassName)}
      />
    </span>
  )
}
