import { Controller, Get, Param } from "@nestjs/common";

import { PagesService } from "./pages.service";

@Controller("public/pages")
export class PublicPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(":slug")
  findPublished(@Param("slug") slug: string) {
    return this.pagesService.findPublicBySlug(slug);
  }
}
