import { Controller, Get, Param, Query } from "@nestjs/common";

import { PagesService } from "./pages.service";

@Controller("public/pages")
export class PublicPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get(":slug")
  findPublished(
    @Param("slug") slug: string,
    @Query("locale") locale?: string,
  ) {
    return this.pagesService.findPublicBySlug(slug, locale);
  }
}
