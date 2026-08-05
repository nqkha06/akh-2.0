import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AdminAccessAnalysisService } from "./admin-access-analysis.service";
import {
  AdminLinkAccessAnalysisController,
  AdminStuAccessLogsController,
  AdminUserAccessAnalysisController,
} from "./admin-stu-access-logs.controller";
import { StuAccessLogsService } from "./stu-access-logs.service";

@Module({
  imports: [AuthModule],
  controllers: [
    AdminStuAccessLogsController,
    AdminUserAccessAnalysisController,
    AdminLinkAccessAnalysisController,
  ],
  providers: [StuAccessLogsService, AdminAccessAnalysisService],
})
export class StuAccessLogsModule {}
