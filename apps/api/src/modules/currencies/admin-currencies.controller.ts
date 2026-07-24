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
import { CurrenciesService } from "./currencies.service";
import { CreateCurrencyDto } from "./dto/create-currency.dto";
import { UpdateCurrencyDto } from "./dto/update-currency.dto";

@Controller("admin/settings/currencies")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminCurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @Permissions("currencies.read")
  findAll() {
    return this.currenciesService.findAllForAdmin();
  }

  @Post()
  @Permissions("currencies.create")
  create(@Body() dto: CreateCurrencyDto) {
    return this.currenciesService.create(dto);
  }

  @Patch(":id/default")
  @Permissions("currencies.update")
  setDefault(@Param("id", ParseIntPipe) id: number) {
    return this.currenciesService.setDefault(id);
  }

  @Patch(":id")
  @Permissions("currencies.update")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCurrencyDto,
  ) {
    return this.currenciesService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("currencies.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.currenciesService.remove(id);
  }
}
