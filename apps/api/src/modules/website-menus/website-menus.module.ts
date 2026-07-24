import { Module } from "@nestjs/common";

import { LanguagesModule } from "../languages/languages.module";
import { AdminWebsiteMenusController } from "./admin-website-menus.controller";
import { PublicWebsiteMenusController } from "./public-website-menus.controller";
import { WebsiteMenusService } from "./website-menus.service";

@Module({
  imports: [LanguagesModule],
  controllers: [AdminWebsiteMenusController, PublicWebsiteMenusController],
  providers: [WebsiteMenusService],
  exports: [WebsiteMenusService],
})
export class WebsiteMenusModule {}
