import { Module } from "@nestjs/common";

import {
  MemberBioPagesController,
  PublicBioPagesController,
} from "./bio-pages.controller";
import { BioPagesService } from "./bio-pages.service";
import { FilesModule } from "../files/files.module";

@Module({
  imports: [FilesModule],
  controllers: [MemberBioPagesController, PublicBioPagesController],
  providers: [BioPagesService],
})
export class BioPagesModule {}
