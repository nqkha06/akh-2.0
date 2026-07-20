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
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

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

type AdminRequest = Request & { user: AuthenticatedUser };

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
  @Permissions("pages.create")
  create(@Req() request: AdminRequest, @Body() dto: CreatePageDto) {
    return this.pagesService.create(dto, request.user);
  }

  @Patch("bulk/status")
  @Permissions("pages.update")
  updateManyStatuses(
    @Req() request: AdminRequest,
    @Body() dto: BulkUpdatePagesStatusDto,
  ) {
    return this.pagesService.updateManyStatuses(dto, request.user);
  }

  @Delete("bulk")
  @Permissions("pages.delete")
  removeMany(@Body() dto: BulkPagesDto) {
    return this.pagesService.removeMany(dto.ids);
  }

  @Patch(":id")
  @Permissions("pages.update")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.update(id, dto);
  }

  @Patch(":id/status")
  @Permissions("pages.update")
  updateStatus(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePageStatusDto,
  ) {
    return this.pagesService.updateStatus(id, dto, request.user);
  }

  @Delete(":id")
  @Permissions("pages.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.pagesService.remove(id);
  }
}
