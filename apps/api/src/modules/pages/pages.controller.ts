import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  BulkPagesDto,
  BulkUpdatePagesStatusDto,
} from "./dto/bulk-pages.dto";
import { CreatePageDto } from "./dto/create-page.dto";
import { QueryPagesDto } from "./dto/query-pages.dto";
import { UpdatePageStatusDto } from "./dto/update-page-status.dto";
import { UpdatePageDto } from "./dto/update-page.dto";
import { PagesService } from "./pages.service";

@Controller("admin/pages")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @Permissions("pages.read")
  findAll(@Query() query: QueryPagesDto) {
    return this.pagesService.findAll(query);
  }

  @Get(":id")
  @Permissions("pages.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.pagesService.findOne(id);
  }

  @Post()
  @Permissions("pages.create", "admin-media.read")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePageDto) {
    return this.pagesService.create(dto, user);
  }

  @Patch("bulk/status")
  @Permissions("pages.update")
  updateManyStatuses(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkUpdatePagesStatusDto,
  ) {
    return this.pagesService.updateManyStatuses(dto, user);
  }

  @Delete("bulk")
  @Permissions("pages.delete")
  removeMany(@Body() dto: BulkPagesDto) {
    return this.pagesService.removeMany(dto.ids);
  }

  @Patch(":id")
  @Permissions("pages.update", "admin-media.read")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.update(id, dto);
  }

  @Patch(":id/status")
  @Permissions("pages.update")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePageStatusDto,
  ) {
    return this.pagesService.updateStatus(id, dto, user);
  }

  @Delete(":id")
  @Permissions("pages.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.pagesService.remove(id);
  }
}
