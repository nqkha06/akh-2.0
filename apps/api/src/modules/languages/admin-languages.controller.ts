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
import { CreateLanguageDto } from "./dto/create-language.dto";
import { ReorderLanguagesDto } from "./dto/reorder-languages.dto";
import { UpdateLanguageDto } from "./dto/update-language.dto";
import { LanguagesService } from "./languages.service";

@Controller("admin/languages")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminLanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  @Permissions("languages.read")
  findAll() {
    return this.languagesService.findAllForAdmin();
  }

  @Get(":id")
  @Permissions("languages.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.languagesService.findOne(id);
  }

  @Post()
  @Permissions("languages.create")
  create(@Body() dto: CreateLanguageDto) {
    return this.languagesService.create(dto);
  }

  @Patch("reorder")
  @Permissions("languages.update")
  reorder(@Body() dto: ReorderLanguagesDto) {
    return this.languagesService.reorder(dto);
  }

  @Patch(":id/default")
  @Permissions("languages.update")
  setDefault(@Param("id", ParseIntPipe) id: number) {
    return this.languagesService.setDefault(id);
  }

  @Patch(":id")
  @Permissions("languages.update")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.languagesService.update(id, dto);
  }

  @Delete(":id")
  @Permissions("languages.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.languagesService.remove(id);
  }
}
