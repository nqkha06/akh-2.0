import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { AdminLanguagesController } from "./admin-languages.controller";
import { LanguagesService } from "./languages.service";
import { PublicLanguagesController } from "./public-languages.controller";

@Module({
  imports: [AuthModule],
  controllers: [AdminLanguagesController, PublicLanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
