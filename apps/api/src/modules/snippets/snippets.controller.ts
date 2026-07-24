import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { CreateSnippetDto } from "./dto/create-snippet.dto";
import { ListSnippetsQueryDto } from "./dto/list-snippets-query.dto";
import { UpdateSnippetDto } from "./dto/update-snippet.dto";
import { SnippetsService } from "./snippets.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/snippets")
@UseGuards(JwtAccessGuard)
export class SnippetsController {
  constructor(private readonly snippetsService: SnippetsService) {}

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListSnippetsQueryDto,
  ) {
    return this.snippetsService.findAll(request.user.id, query);
  }

  @Get(":id")
  findOne(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.snippetsService.findOne(request.user.id, id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateSnippetDto,
  ) {
    return this.snippetsService.create(request.user.id, dto);
  }

  @Patch(":id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateSnippetDto,
  ) {
    return this.snippetsService.update(request.user.id, id, dto);
  }

  @Delete(":id")
  remove(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.snippetsService.remove(request.user.id, id);
  }
}
