import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { CreateSnippetDto } from "./dto/create-snippet.dto";
import { ListSnippetsQueryDto } from "./dto/list-snippets-query.dto";
import { UpdateSnippetDto } from "./dto/update-snippet.dto";
import { SnippetsService } from "./snippets.service";

@Controller("member/snippets")
@UseGuards(JwtAccessGuard)
export class SnippetsController {
  constructor(private readonly snippetsService: SnippetsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSnippetsQueryDto,
  ) {
    return this.snippetsService.findAll(user.id, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.snippetsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSnippetDto,
  ) {
    return this.snippetsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateSnippetDto,
  ) {
    return this.snippetsService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.snippetsService.remove(user.id, id);
  }
}
