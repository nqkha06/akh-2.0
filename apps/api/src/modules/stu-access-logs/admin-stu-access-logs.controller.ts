import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AdminAccessAnalysisService } from "./admin-access-analysis.service";
import {
  AccessAnalysisQueryDto,
  IpAccessAnalysisQueryDto,
} from "./dto/access-analysis-query.dto";
import { ListStuAccessLogsQueryDto } from "./dto/list-stu-access-logs-query.dto";
import { ReviewAccessLogDto } from "./dto/review-access-log.dto";
import { StuAccessLogsService } from "./stu-access-logs.service";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller("admin/stu-access-logs")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminStuAccessLogsController {
  constructor(
    private readonly accessLogs: StuAccessLogsService,
    private readonly analysis: AdminAccessAnalysisService,
  ) {}

  @Get()
  @Permissions("stu_access_logs.view")
  findAll(@Req() request: AdminRequest, @Query() query: ListStuAccessLogsQueryDto) {
    return this.accessLogs.findAll(query, request.user);
  }

  @Get("stats")
  @Permissions("stu_access_logs.view")
  stats(@Req() request: AdminRequest) {
    return this.accessLogs.stats(request.user);
  }

  @Get("analysis/ip")
  @Permissions("stu_access_logs.view")
  analyzeIp(@Req() request: AdminRequest, @Query() query: IpAccessAnalysisQueryDto) {
    return this.analysis.analyzeIp(query.ip, query, request.user);
  }

  @Get(":id")
  @Permissions("stu_access_logs.view")
  findOne(@Req() request: AdminRequest, @Param("id") id: string) {
    return this.accessLogs.findOne(id, request.user);
  }

  @Get(":id/related")
  @Permissions("stu_access_logs.view")
  related(@Req() request: AdminRequest, @Param("id") id: string) {
    return this.accessLogs.findOne(id, request.user).then((item) => item.related);
  }

  @Post(":id/review")
  @Permissions("stu_access_logs.review")
  review(
    @Req() request: AdminRequest,
    @Param("id") id: string,
    @Body() dto: ReviewAccessLogDto,
  ) {
    return this.accessLogs.review(id, dto, request.user);
  }
}

@Controller("admin/users")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminUserAccessAnalysisController {
  constructor(
    private readonly accessLogs: StuAccessLogsService,
    private readonly analysis: AdminAccessAnalysisService,
  ) {}

  @Get(":userId/access-analysis")
  @Permissions("stu_access_logs.view")
  analyzeUser(
    @Req() request: AdminRequest,
    @Param("userId", ParseIntPipe) userId: number,
    @Query() query: AccessAnalysisQueryDto,
  ) {
    return this.analysis.analyzeUser(userId, query, request.user);
  }

  @Get(":userId/access-logs")
  @Permissions("stu_access_logs.view")
  accessLogsForUser(
    @Req() request: AdminRequest,
    @Param("userId", ParseIntPipe) userId: number,
    @Query() query: ListStuAccessLogsQueryDto,
  ) {
    return this.accessLogs.findForUser(userId, query, request.user);
  }
}

@Controller("admin/social-links")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminLinkAccessAnalysisController {
  constructor(private readonly analysis: AdminAccessAnalysisService) {}

  @Get(":linkId/access-analysis")
  @Permissions("stu_access_logs.view")
  analyzeLink(
    @Req() request: AdminRequest,
    @Param("linkId", ParseIntPipe) linkId: number,
    @Query() query: AccessAnalysisQueryDto,
  ) {
    return this.analysis.analyzeLink(linkId, query, request.user);
  }
}
