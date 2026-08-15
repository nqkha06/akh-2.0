import { BadRequestException } from "@nestjs/common";
import sanitizeHtml from "sanitize-html";

const EMPTY_PAGE_DOCUMENT: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function normalizePageSlug(value: string) {
  const slug = value
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[đĐ]/g, (character) => (character === "đ" ? "d" : "D"))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
  if (!slug) {
    throw new BadRequestException("Slug không hợp lệ.");
  }
  return slug;
}

export function localizedPageSlugCandidates(slug: string, locale?: string) {
  const localeCode = locale?.trim().toLowerCase().split("-")[0] ?? "";
  const localizedSlug =
    localeCode && localeCode !== "vi" && /^[a-z]{2,3}$/.test(localeCode)
      ? `${slug}-${localeCode}`
      : slug;
  return [...new Set([localizedSlug, slug])];
}

export function serializePageContent(content: Record<string, unknown>) {
  if (content.type !== "doc") {
    throw new BadRequestException("contentJson phải là tài liệu Tiptap.");
  }
  const serialized = JSON.stringify(content);
  if (Buffer.byteLength(serialized, "utf8") > 1_000_000) {
    throw new BadRequestException("Nội dung trang vượt quá 1 MB.");
  }
  return serialized;
}

export function parsePageContent(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : { ...EMPTY_PAGE_DOCUMENT };
  } catch {
    return { ...EMPTY_PAGE_DOCUMENT };
  }
}

export function sanitizePageContent(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "blockquote",
      "ul",
      "ol",
      "li",
      "div",
      "span",
      "label",
      "input",
      "a",
      "img",
      "hr",
      "br",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      ul: ["data-type"],
      li: ["data-type", "data-checked"],
      input: ["type", "checked", "disabled"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|center|right|justify)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
      input: (_tagName, attributes) => ({
        tagName: "input",
        attribs: {
          type: "checkbox",
          disabled: "disabled",
          ...(attributes.checked ? { checked: "checked" } : {}),
        },
      }),
    },
  });
}

export function emptyPageValueToNull(value?: string | null) {
  if (!value) return null;
  return value.trim() || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
