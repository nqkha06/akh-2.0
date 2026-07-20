import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AuthorizationService } from "./authorization.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Controller("admin")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AuthorizationController {
  constructor(
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Get("roles")
  @Permissions("roles.read")
  listRoles() {
    return this.authorizationService.listRoles();
  }

  @Post("roles")
  @Permissions("roles.create")
  createRole(@Body() dto: CreateRoleDto) {
    return this.authorizationService.createRole(dto);
  }

  @Patch("roles/:id")
  @Permissions("roles.update")
  updateRole(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.authorizationService.updateRole(id, dto);
  }

  @Delete("roles/:id")
  @Permissions("roles.delete")
  deleteRole(@Param("id", ParseIntPipe) id: number) {
    return this.authorizationService.deleteRole(id);
  }

  @Get("permissions")
  @Permissions("roles.read")
  listPermissions() {
    return this.authorizationService.listPermissions();
  }
}

