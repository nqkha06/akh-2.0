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

import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { CreateMonetizationLevelDto } from "./dto/create-monetization-level.dto";
import { ListMonetizationLevelsQueryDto } from "./dto/list-monetization-levels-query.dto";
import { UpdateMonetizationLevelDto } from "./dto/update-monetization-level.dto";
import { MonetizationLevelsService } from "./monetization-levels.service";

@Controller("admin/monetization-levels")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class MonetizationLevelsController {
  constructor(
    private readonly monetizationLevelsService: MonetizationLevelsService,
  ) {}

  @Get()
  @Permissions("monetization-levels.read")
  findAll(@Query() query: ListMonetizationLevelsQueryDto) {
    return this.monetizationLevelsService.findAll(query);
  }

  @Get(":id")
  @Permissions("monetization-levels.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.monetizationLevelsService.findOne(id);
  }

  @Post()
  @Permissions("monetization-levels.create")
  create(@Body() dto: CreateMonetizationLevelDto) {
    return this.monetizationLevelsService.create(dto);
  }

  @Patch(":id")
  @Permissions("monetization-levels.update")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMonetizationLevelDto,
  ) {
    return this.monetizationLevelsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("monetization-levels.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.monetizationLevelsService.remove(id);
  }
}
