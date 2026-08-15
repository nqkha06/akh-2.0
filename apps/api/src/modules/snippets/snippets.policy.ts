import { NotFoundException } from "@nestjs/common";

export function parseSnippetId(id: string) {
  const parsed = Number(id);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new NotFoundException("Không tìm thấy snippet.");
  }
  return parsed;
}

export function assertSnippetExists(
  snippet: { id: number } | null,
): asserts snippet is { id: number } {
  if (!snippet) {
    throw new NotFoundException("Không tìm thấy snippet.");
  }
}
