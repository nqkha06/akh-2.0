import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";

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

  @Get(":slug/media/:fileId")
  @Header("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
  async galleryImage(
    @Param("slug") slug: string,
    @Param("fileId") fileId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.bioPagesService.findPublicGalleryImage(slug, fileId);
    response.set({
      "Content-Type": result.file.mimeType,
      "Content-Length": result.file.size.toString(),
      "Content-Disposition": `inline; filename="${encodeURIComponent(result.file.name)}"`,
    });
    return result.stream;
  }
}
