import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";

import { CreateSnippetDto } from "./dto/create-snippet.dto";
import { UpdateSnippetDto } from "./dto/update-snippet.dto";
import { SnippetsService } from "./snippets.service";

@Controller("snippets")
export class SnippetsController {
  constructor(private readonly snippetsService: SnippetsService) {}

  @Get()
  findAll() {
    return this.snippetsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.snippetsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSnippetDto) {
    return this.snippetsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSnippetDto) {
    return this.snippetsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.snippetsService.remove(id);
  }
}
