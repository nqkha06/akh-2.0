import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateSnippetDto } from "./dto/create-snippet.dto";
import { ListSnippetsQueryDto } from "./dto/list-snippets-query.dto";
import { UpdateSnippetDto } from "./dto/update-snippet.dto";

@Injectable()
export class SnippetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, query: ListSnippetsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const search = query.search?.trim();
    const where: Prisma.SnippetWhereInput = {
      userId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {}),
    };

    const [snippets, totalItems] = await this.prisma.$transaction([
      this.prisma.snippet.findMany({
        where,
        orderBy: { [query.sortBy || "createdAt"]: query.sortOrder || "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.snippet.count({ where }),
    ]);

    return {
      items: snippets.map((snippet) => this.toResponse(snippet)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async findOne(userId: number, id: string) {
    const snippetId = this.parseId(id);
    const snippet = await this.prisma.snippet.findFirst({
      where: { id: snippetId, userId, deletedAt: null },
    });

    if (!snippet) {
      throw new NotFoundException("Không tìm thấy snippet.");
    }

    return this.toResponse(snippet);
  }

  async create(userId: number, dto: CreateSnippetDto) {
    const content = dto.content.trim();
    const name = dto.name?.trim() || content.slice(0, 36) || "Untitled snippet";

    return this.toResponse(
      await this.prisma.snippet.create({
        data: { userId, name, content },
      }),
    );
  }

  async update(userId: number, id: string, dto: UpdateSnippetDto) {
    const snippetId = this.parseId(id);
    await this.assertOwned(userId, snippetId);

    return this.toResponse(
      await this.prisma.snippet.update({
        where: { id: snippetId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        },
      }),
    );
  }

  async remove(userId: number, id: string) {
    const snippetId = this.parseId(id);
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

    if (!exists) {
      throw new NotFoundException("Không tìm thấy snippet.");
    }
  }

  private parseId(id: string) {
    const parsed = Number(id);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new NotFoundException("Không tìm thấy snippet.");
    }
    return parsed;
  }

  private toResponse(snippet: {
    id: number;
    name: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      id: String(snippet.id),
      name: snippet.name,
      content: snippet.content,
      createdAt: snippet.createdAt,
      updatedAt: snippet.updatedAt,
    };
  }
}
