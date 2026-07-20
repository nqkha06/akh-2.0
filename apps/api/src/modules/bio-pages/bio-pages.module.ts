import { Module } from "@nestjs/common";

import { BioPagesController } from "./bio-pages.controller";
import { BioPagesService } from "./bio-pages.service";

@Module({
  controllers: [BioPagesController],
  providers: [BioPagesService],
})
export class BioPagesModule {}
