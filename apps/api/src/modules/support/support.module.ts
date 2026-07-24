import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AdminSupportTicketsController } from "./admin-support-tickets.controller";
import { MemberSupportTicketsController } from "./member-support-tickets.controller";
import { SupportTicketStorageService } from "./support-ticket-storage.service";
import { SupportTicketsService } from "./support-tickets.service";

@Module({
  imports: [AuthModule],
  controllers: [
    AdminSupportTicketsController,
    MemberSupportTicketsController,
  ],
  providers: [SupportTicketsService, SupportTicketStorageService],
})
export class SupportModule {}
