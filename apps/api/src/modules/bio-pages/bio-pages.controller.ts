import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { BioPagesService } from "./bio-pages.service";
import { CreateBioPageDto } from "./dto/create-bio-page.dto";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("member/bio-pages")
@UseGuards(JwtAccessGuard)
export class MemberBioPagesController {
  constructor(private readonly bioPagesService: BioPagesService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateBioPageDto,
  ) {
    return this.bioPagesService.create(request.user.id, dto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.bioPagesService.findAll(request.user.id);
  }

  @Get(":id")
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.bioPagesService.findOneForMember(request.user.id, id);
  }

  @Patch(":id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: CreateBioPageDto,
  ) {
    return this.bioPagesService.update(request.user.id, id, dto);
  }

  @Delete(":id")
  remove(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.bioPagesService.remove(request.user.id, id);
  }
}

@Controller("public/bio-pages")
export class PublicBioPagesController {
  constructor(private readonly bioPagesService: BioPagesService) {}

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.bioPagesService.findPublic(slug);
  }

  @Post(":slug/click")
  @HttpCode(200)
  trackClick(@Param("slug") slug: string) {
    return this.bioPagesService.trackClick(slug);
  }
}
