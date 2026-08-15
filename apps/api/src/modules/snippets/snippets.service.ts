import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateSnippetDto } from "./dto/create-snippet.dto";
import { ListSnippetsQueryDto } from "./dto/list-snippets-query.dto";
import { UpdateSnippetDto } from "./dto/update-snippet.dto";
import {
  buildSnippetCreateData,
  buildSnippetUpdateData,
  mapSnippetResponse,
} from "./snippets.mapper";
import { assertSnippetExists, parseSnippetId } from "./snippets.policy";
import { buildSnippetsListQuery } from "./queries/snippets-list-query.builder";
import { SNIPPET_RESPONSE_SELECT } from "./snippets.select";

@Injectable()
export class SnippetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, query: ListSnippetsQueryDto) {
    const { where, orderBy, skip, take } = buildSnippetsListQuery(userId, query);

    const [snippets, totalItems] = await this.prisma.$transaction([
      this.prisma.snippet.findMany({
        where,
        orderBy,
        skip,
        take,
        select: SNIPPET_RESPONSE_SELECT,
      }),
      this.prisma.snippet.count({ where }),
    ]);

    return {
      items: snippets.map(mapSnippetResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
      },
    };
  }

  async findOne(userId: number, id: string) {
    const snippetId = parseSnippetId(id);
    const snippet = await this.prisma.snippet.findFirst({
      where: { id: snippetId, userId, deletedAt: null },
      select: SNIPPET_RESPONSE_SELECT,
    });
    assertSnippetExists(snippet);
    return mapSnippetResponse(snippet);
  }

  async create(userId: number, dto: CreateSnippetDto) {
    return mapSnippetResponse(
      await this.prisma.snippet.create({
        data: { userId, ...buildSnippetCreateData(dto) },
        select: SNIPPET_RESPONSE_SELECT,
      }),
    );
  }

  async update(userId: number, id: string, dto: UpdateSnippetDto) {
    const snippetId = parseSnippetId(id);
    await this.assertOwned(userId, snippetId);

    return mapSnippetResponse(
      await this.prisma.snippet.update({
        where: { id: snippetId },
        data: buildSnippetUpdateData(dto),
        select: SNIPPET_RESPONSE_SELECT,
      }),
    );
  }

  async remove(userId: number, id: string) {
    const snippetId = parseSnippetId(id);
    await this.assertOwned(userId, snippetId);
    await this.prisma.snippet.update({
      where: { id: snippetId },
      data: { deletedAt: new Date() },
    });
    return { id, deleted: true };
  }

  private async assertOwned(userId: number, id: number) {
    const exists = await this.prisma.snippet.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true },
    });

    assertSnippetExists(exists);
  }
}
