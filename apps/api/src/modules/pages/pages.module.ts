import { Module } from "@nestjs/common";

import { PagesController } from "./pages.controller";
import { PagesService } from "./pages.service";
import { PublicPagesController } from "./public-pages.controller";

@Module({
  controllers: [PagesController, PublicPagesController],
  providers: [PagesService],
})
export class PagesModule {}
