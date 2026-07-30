import { Module } from "@nestjs/common";

import { AdminAnnouncementsController } from "./admin-announcements.controller";
import { AnnouncementsService } from "./announcements.service";
import { MemberAnnouncementsController } from "./member-announcements.controller";

@Module({
  controllers: [AdminAnnouncementsController, MemberAnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
