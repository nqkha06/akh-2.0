import { BadRequestException } from "@nestjs/common";
import sanitizeHtml from "sanitize-html";

import type { EmailTemplateVariableDto } from "./dto/email-templates.dto";

const VARIABLE_PATTERN = /{{\s*([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*)\s*}}/g;
const SAFE_STYLE = /^(?!.*(?:url\s*\(|expression\s*\(|javascript:)).{0,240}$/i;

export type TemplateContent = {
  subject: string;
  preheader?: string | null;
  htmlContent: string;
  textContent?: string | null;
  variables: EmailTemplateVariableDto[];
  status: string;
};

export function extractTemplateVariables(...contents: Array<string | null | undefined>) {
  const variables = new Set<string>();
  for (const content of contents) {
    if (!content) continue;
    for (const match of content.matchAll(VARIABLE_PATTERN)) variables.add(match[1]);
  }
  return [...variables];
}

export function validateTemplateVariables(input: TemplateContent) {
  const schemaKeys = new Set(input.variables.map((variable) => variable.key));
  const used = extractTemplateVariables(
    input.subject,
    input.preheader,
    input.htmlContent,
    input.textContent,
  );
  const missing = used.filter((key) => !schemaKeys.has(key));
  if (missing.length) {
    throw new BadRequestException(
      `Các biến chưa được khai báo trong schema: ${missing.join(", ")}.`,
    );
  }
  if (input.status === "active") {
    const withoutExample = input.variables
      .filter(
        (variable) =>
          variable.required &&
          (variable.example === undefined ||
            variable.example === null ||
            String(variable.example).trim() === ""),
      )
      .map((variable) => variable.key);
    if (withoutExample.length) {
      throw new BadRequestException(
        `Template active cần dữ liệu mẫu cho biến bắt buộc: ${withoutExample.join(", ")}.`,
      );
    }
  }
}

export function sanitizeEmailHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "html",
      "head",
      "body",
      "title",
      "meta",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
      "div",
      "span",
      "p",
      "br",
      "hr",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "img",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
    ],
    allowedAttributes: {
      "*": ["class", "id", "style", "role", "aria-label"],
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height"],
      table: ["width", "cellpadding", "cellspacing", "border", "align"],
      td: ["width", "height", "colspan", "rowspan", "align", "valign"],
      th: ["width", "height", "colspan", "rowspan", "align", "valign"],
      meta: ["name", "content", "charset"],
    },
    allowedSchemes: ["http", "https", "mailto", "cid"],
    allowedSchemesByTag: { img: ["http", "https", "cid"] },
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        color: [SAFE_STYLE],
        "background-color": [SAFE_STYLE],
        "font-family": [SAFE_STYLE],
        "font-size": [SAFE_STYLE],
        "font-weight": [SAFE_STYLE],
        "line-height": [SAFE_STYLE],
        "text-align": [SAFE_STYLE],
        "text-decoration": [SAFE_STYLE],
        padding: [SAFE_STYLE],
        "padding-top": [SAFE_STYLE],
        "padding-right": [SAFE_STYLE],
        "padding-bottom": [SAFE_STYLE],
        "padding-left": [SAFE_STYLE],
        margin: [SAFE_STYLE],
        "margin-top": [SAFE_STYLE],
        "margin-right": [SAFE_STYLE],
        "margin-bottom": [SAFE_STYLE],
        "margin-left": [SAFE_STYLE],
        border: [SAFE_STYLE],
        "border-radius": [SAFE_STYLE],
        width: [SAFE_STYLE],
        "max-width": [SAFE_STYLE],
        height: [SAFE_STYLE],
        display: [SAFE_STYLE],
      },
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "noopener noreferrer" },
      }),
    },
  });
}

export function htmlToPlainText(html: string) {
  const withLineBreaks = html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(?:p|div|h[1-6]|li|tr|blockquote|pre)\s*>/gi, "\n");
  return sanitizeHtml(withLineBreaks, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildTemplateSample(
  variables: EmailTemplateVariableDto[],
  overrides: Record<string, unknown> = {},
) {
  return Object.fromEntries(
    variables.map((variable) => [
      variable.key,
      overrides[variable.key] ?? variable.example ?? `{{${variable.key}}}`,
    ]),
  );
}

export function renderTemplateContent(
  content: string,
  sample: Record<string, unknown>,
) {
  return content.replace(VARIABLE_PATTERN, (_match, key: string) => {
    const value = resolveSampleValue(sample, key);
    return value === undefined || value === null ? `{{${key}}}` : String(value);
  });
}

function resolveSampleValue(sample: Record<string, unknown>, key: string) {
  if (Object.prototype.hasOwnProperty.call(sample, key)) return sample[key];
  return key.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, sample);
}
