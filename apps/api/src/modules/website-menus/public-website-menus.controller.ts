import { Controller, Get, Query } from "@nestjs/common";

import { PublicWebsiteMenusQueryDto } from "./dto/website-menu.dto";
import { WebsiteMenusService } from "./website-menus.service";

@Controller("website/menus")
export class PublicWebsiteMenusController {
  constructor(private readonly menusService: WebsiteMenusService) {}

  @Get()
  findPublished(@Query() query: PublicWebsiteMenusQueryDto) {
    return this.menusService.findPublishedByLocations(query);
  }
}
