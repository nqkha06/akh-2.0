import { Module } from "@nestjs/common";

import { SnippetsModule } from "../snippets/snippets.module";
import { AdminLinksController } from "./admin-links.controller";
import { AdminLinksService } from "./admin-links.service";
import { LinksController } from "./links.controller";
import { LinksService } from "./links.service";

@Module({
  imports: [SnippetsModule],
  controllers: [LinksController, AdminLinksController],
  providers: [LinksService, AdminLinksService],
})
export class LinksModule {}
