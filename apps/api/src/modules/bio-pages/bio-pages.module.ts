import { Module } from "@nestjs/common";

import {
  MemberBioPagesController,
  PublicBioPagesController,
} from "./bio-pages.controller";
import { BioPagesService } from "./bio-pages.service";

@Module({
  controllers: [MemberBioPagesController, PublicBioPagesController],
  providers: [BioPagesService],
})
export class BioPagesModule {}
