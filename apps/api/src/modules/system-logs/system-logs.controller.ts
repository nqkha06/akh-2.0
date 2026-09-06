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
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AdminSystemLogsService } from "./admin-system-logs.service";
import {
  BulkDeleteSystemLogsDto,
  CleanupSystemLogsDto,
} from "./dto/delete-system-logs.dto";
import { ListSystemLogsQueryDto } from "./dto/list-system-logs-query.dto";
import {
  CreateSystemLogCategoryDto,
  UpdateSystemLogCategoryDto,
} from "./dto/system-log-category.dto";
import { UpdateSystemLogSettingsDto } from "./dto/update-system-log-settings.dto";
import { SystemLogSettingsService } from "./system-log-settings.service";

@Controller("admin/system-logs")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class SystemLogsController {
  constructor(private readonly logs: AdminSystemLogsService) {}

  @Get()
  @Permissions("system_logs.view")
  findAll(@Query() query: ListSystemLogsQueryDto) {
    return this.logs.findAll(query);
  }

  @Get("stats")
  @Permissions("system_logs.view")
  stats() {
    return this.logs.stats();
  }

  @Get(":id")
  @Permissions("system_logs.view")
  findOne(@Param("id") id: string) {
    return this.logs.findOne(id);
  }

  @Delete(":id")
  @Permissions("system_logs.delete")
  deleteOne(@Param("id") id: string) {
    return this.logs.deleteOne(id);
  }

  @Post("bulk-delete")
  @Permissions("system_logs.delete")
  bulkDelete(@Body() dto: BulkDeleteSystemLogsDto) {
    return this.logs.bulkDelete(dto);
  }

  @Post("cleanup")
  @Permissions("system_logs.delete")
  cleanup(@Body() dto: CleanupSystemLogsDto) {
    return this.logs.cleanup(dto);
  }
}

@Controller("admin/system-log-settings")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class SystemLogSettingsController {
  constructor(private readonly settings: SystemLogSettingsService) {}

  @Get()
  @Permissions("system_logs.view")
  getSettings() {
    return this.settings.getSettings();
  }

  @Put()
  @Permissions("system_logs.manage_settings")
  updateSettings(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateSystemLogSettingsDto,
  ) {
    return this.settings.updateSettings(dto, admin.id);
  }
}

@Controller("admin/system-log-categories")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class SystemLogCategoriesController {
  constructor(private readonly settings: SystemLogSettingsService) {}

  @Get()
  @Permissions("system_logs.view")
  list() {
    return this.settings.listCategories();
  }

  @Post()
  @Permissions("system_logs.manage_settings")
  create(@Body() dto: CreateSystemLogCategoryDto) {
    return this.settings.createCategory(dto);
  }

  @Patch(":id")
  @Permissions("system_logs.manage_settings")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSystemLogCategoryDto,
  ) {
    return this.settings.updateCategory(id, dto);
  }
}
