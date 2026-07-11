import { Module } from "@nestjs/common";

import { SnippetsModule } from "../snippets/snippets.module";
import { LinksController } from "./links.controller";
import { LinksService } from "./links.service";

@Module({
  imports: [SnippetsModule],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
