import { Module } from "@nestjs/common";

import { LanguagesModule } from "../languages/languages.module";
import { AdminAnnouncementsController } from "./admin-announcements.controller";
import { AnnouncementsService } from "./announcements.service";
import { MemberAnnouncementsController } from "./member-announcements.controller";

@Module({
  imports: [LanguagesModule],
  controllers: [AdminAnnouncementsController, MemberAnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
