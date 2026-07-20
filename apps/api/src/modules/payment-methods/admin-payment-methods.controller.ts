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
import { CreatePaymentMethodDto } from "./dto/create-payment-method.dto";
import { UpdatePaymentMethodDto } from "./dto/update-payment-method.dto";
import { PaymentMethodsService } from "./payment-methods.service";

@Controller("admin/payment-methods")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminPaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @Permissions("payment-methods.read")
  findAll() {
    return this.paymentMethodsService.findAllForAdmin();
  }

  @Get(":id")
  @Permissions("payment-methods.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.paymentMethodsService.findOneForAdmin(id);
  }

  @Post()
  @Permissions("payment-methods.create")
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(dto);
  }

  @Patch(":id")
  @Permissions("payment-methods.update")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodsService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("payment-methods.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.paymentMethodsService.remove(id);
  }
}
