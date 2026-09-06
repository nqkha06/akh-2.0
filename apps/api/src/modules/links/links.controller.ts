import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateLinkDto } from "./dto/create-link.dto";
import { RecordLinkVisitDto } from "./dto/record-link-visit.dto";
import { UpdateLinkStatusDto } from "./dto/update-link-status.dto";
import { LinksService } from "./links.service";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("links")
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createLinkDto: CreateLinkDto,
  ) {
    return this.linksService.create(request.user.id, createLinkDto);
  }

  @Post(":slug/visit")
  @HttpCode(200)
  recordVisit(
    @Param("slug") slug: string,
    @Req() request: Request,
    @Body() context: RecordLinkVisitDto = {},
  ) {
    return this.linksService.recordVisit(slug, {
      countryCode: request.get("x-visitor-country"),
      userAgent: request.get("user-agent"),
      ipAddress: request.get("x-visitor-ip") || request.ip,
      referrer: request.get("referer"),
      pageContext: context,
    });
  }

  @Post(":slug/visit/:visitToken/complete")
  @HttpCode(200)
  completeVisit(
    @Param("slug") slug: string,
    @Param("visitToken") visitToken: string,
  ) {
    return this.linksService.completeVisit(slug, visitToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.linksService.findAll(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("alias/check")
  checkAlias(@Query("alias") alias: string) {
    return this.linksService.checkAlias(alias);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/status")
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateLinkStatusDto,
  ) {
    return this.linksService.updateStatus(request.user.id, id, updateStatusDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() updateLinkDto: CreateLinkDto,
  ) {
    return this.linksService.update(request.user.id, id, updateLinkDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.linksService.remove(request.user.id, id);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.linksService.findOne(slug);
  }
}
