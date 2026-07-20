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
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import {
  BulkUpdateUserStatusDto,
  UpdateUserAccessDto,
  UpdateUserStatusDto,
  UserIdsDto,
} from "./dto/user-actions.dto";
import { UsersService } from "./users.service";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller("admin/users")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions("users.read")
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get("access-options")
  @Permissions("users.read")
  getAccessOptions() {
    return this.usersService.getAccessOptions();
  }

  @Get(":id")
  @Permissions("users.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions("users.create")
  create(@Req() request: AdminRequest, @Body() dto: CreateUserDto) {
    return this.usersService.create(request.user, dto);
  }

  @Patch("bulk/status")
  @Permissions("users.manage-status")
  updateManyStatuses(
    @Req() request: AdminRequest,
    @Body() dto: BulkUpdateUserStatusDto,
  ) {
    return this.usersService.updateManyStatuses(
      request.user,
      dto.ids,
      dto.status,
    );
  }

  @Delete("bulk")
  @Permissions("users.delete")
  removeMany(@Req() request: AdminRequest, @Body() dto: UserIdsDto) {
    return this.usersService.removeMany(request.user, dto.ids);
  }

  @Patch(":id")
  @Permissions("users.update")
  update(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(request.user, id, dto);
  }

  @Patch(":id/status")
  @Permissions("users.manage-status")
  updateStatus(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(request.user, id, dto.status);
  }

  @Patch(":id/access")
  @Permissions("users.manage-roles")
  updateAccess(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserAccessDto,
  ) {
    return this.usersService.updateAccess(request.user, id, dto);
  }

  @Post(":id/verify-email")
  @Permissions("users.verify-email")
  verifyEmail(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.verifyEmail(id);
  }

  @Post(":id/revoke-sessions")
  @Permissions("users.revoke-sessions")
  revokeSessions(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.usersService.revokeSessions(request.user, id);
  }

  @Delete(":id")
  @Permissions("users.delete")
  remove(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.usersService.remove(request.user, id);
  }
}
