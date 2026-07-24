import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  AssignWebsiteMenuLocationDto,
  CreateWebsiteMenuDto,
  ReplaceWebsiteMenuTreeDto,
  UpdateWebsiteMenuDto,
} from "./dto/website-menu.dto";
import { WebsiteMenusService } from "./website-menus.service";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller("admin/menus")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminWebsiteMenusController {
  constructor(private readonly menusService: WebsiteMenusService) {}

  @Get()
  @Permissions("menus.read")
  findAll() {
    return this.menusService.findAllForAdmin();
  }

  @Get("locations")
  @Permissions("menus.read")
  findLocations() {
    return this.menusService.findLocations();
  }

  @Get(":id")
  @Permissions("menus.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.menusService.findOneForAdmin(id);
  }

  @Post()
  @Permissions("menus.create")
  create(@Req() request: AdminRequest, @Body() dto: CreateWebsiteMenuDto) {
    return this.menusService.create(dto, request.user.id);
  }

  @Patch("locations")
  @Permissions("menus.assign")
  assignLocation(
    @Req() request: AdminRequest,
    @Body() dto: AssignWebsiteMenuLocationDto,
  ) {
    return this.menusService.assignLocation(dto, request.user.id);
  }

  @Delete("locations/:location")
  @Permissions("menus.assign")
  unassignLocation(@Param("location") location: string) {
    return this.menusService.unassignLocation(location);
  }

  @Patch(":id")
  @Permissions("menus.update")
  update(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateWebsiteMenuDto,
  ) {
    return this.menusService.update(id, dto, request.user.id);
  }

  @Put(":id/tree")
  @Permissions("menus.update")
  replaceTree(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReplaceWebsiteMenuTreeDto,
  ) {
    return this.menusService.replaceTree(id, dto, request.user.id);
  }

  @Post(":id/publish")
  @Permissions("menus.publish")
  publish(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.menusService.publish(id, request.user.id);
  }

  @Post(":id/unpublish")
  @Permissions("menus.publish")
  unpublish(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.menusService.unpublish(id, request.user.id);
  }

  @Post(":id/duplicate")
  @Permissions("menus.create")
  duplicate(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.menusService.duplicate(id, request.user.id);
  }

  @Delete(":id")
  @Permissions("menus.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.menusService.remove(id);
  }
}
