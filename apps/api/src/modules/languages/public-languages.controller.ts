import { Controller, Get } from "@nestjs/common";

import { LanguagesService } from "./languages.service";

@Controller("languages")
export class PublicLanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  findEnabled() {
    return this.languagesService.findEnabled();
  }
}
