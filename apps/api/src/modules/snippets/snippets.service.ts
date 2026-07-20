import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateSnippetDto } from "./dto/create-snippet.dto";
import { UpdateSnippetDto } from "./dto/update-snippet.dto";

@Injectable()
export class SnippetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const snippets = await this.prisma.snippet.findMany({
      orderBy: { createdAt: "desc" },
    });

    return snippets.map((snippet) => this.toResponse(snippet));
  }

  async findOne(id: string) {
    const snippet = await this.prisma.snippet.findUnique({ where: { id } });

    if (!snippet) {
      throw new NotFoundException("Không tìm thấy snippet.");
    }

    return this.toResponse(snippet);
  }

  async create(dto: CreateSnippetDto) {
    const content = dto.content.trim();
    const name = dto.name?.trim() || content.slice(0, 36) || "Untitled snippet";

    return this.toResponse(
      await this.prisma.snippet.create({
        data: { name, content },
      }),
    );
  }

  async update(id: string, dto: UpdateSnippetDto) {
    await this.assertExists(id);

    return this.toResponse(
      await this.prisma.snippet.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        },
      }),
    );
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.snippet.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async assertExists(id: string) {
    const exists = await this.prisma.snippet.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException("Không tìm thấy snippet.");
    }
  }

  private toResponse(snippet: {
    id: string;
    name: string;
    content: string;
    copies: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: snippet.id,
      name: snippet.name,
      content: snippet.content,
      copies: snippet.copies,
      createdAt: snippet.createdAt,
      updatedAt: snippet.updatedAt,
    };
  }
}
