import type { CreateSnippetDto } from "./dto/create-snippet.dto";
import type { UpdateSnippetDto } from "./dto/update-snippet.dto";
import type { SnippetResponseRecord } from "./snippets.select";

export function mapSnippetResponse(snippet: SnippetResponseRecord) {
  return {
    id: String(snippet.id),
    name: snippet.name,
    content: snippet.content,
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
  };
}

export function buildSnippetCreateData(dto: CreateSnippetDto) {
  const content = dto.content.trim();
  return {
    content,
    name: dto.name?.trim() || content.slice(0, 36) || "Untitled snippet",
  };
}

export function buildSnippetUpdateData(dto: UpdateSnippetDto) {
  return {
    ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
    ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
  };
}
