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
import { LoyaltyService } from "./loyalty.service";
import { CreateLoyaltyTierDto } from "./dto/create-loyalty-tier.dto";
import { ListLoyaltyTiersQueryDto } from "./dto/list-loyalty-tiers-query.dto";
import { UpdateLoyaltyTierDto } from "./dto/update-loyalty-tier.dto";

@Controller("admin/loyalty-tiers")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminLoyaltyTiersController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  @Permissions("loyalty-tiers.read")
  findAll(@Query() query: ListLoyaltyTiersQueryDto) {
    return this.loyaltyService.findAllTiers(query);
  }

  @Get(":id")
  @Permissions("loyalty-tiers.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.loyaltyService.findOneTier(id);
  }

  @Post()
  @Permissions("loyalty-tiers.create")
  create(@Body() dto: CreateLoyaltyTierDto) {
    return this.loyaltyService.createTier(dto);
  }

  @Patch(":id")
  @Permissions("loyalty-tiers.update")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLoyaltyTierDto,
  ) {
    return this.loyaltyService.updateTier(id, dto);
  }

  @Delete(":id")
  @Permissions("loyalty-tiers.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.loyaltyService.removeTier(id);
  }
}
