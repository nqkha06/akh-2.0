import { Controller, Get, Param } from "@nestjs/common";

import { LanguagesService } from "./languages.service";

@Controller("languages")
export class PublicLanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  findPublished() {
    return this.languagesService.findPublished();
  }

  @Get(":locale/ui-messages")
  findUiMessages(@Param("locale") locale: string) {
    return this.languagesService.findPublicUiMessages(locale);
  }
}
