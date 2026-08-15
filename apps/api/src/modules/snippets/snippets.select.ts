import { Prisma } from "@prisma/client";

export const SNIPPET_RESPONSE_SELECT = {
  id: true,
  name: true,
  content: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SnippetSelect;

export type SnippetResponseRecord = Prisma.SnippetGetPayload<{
  select: typeof SNIPPET_RESPONSE_SELECT;
}>;
