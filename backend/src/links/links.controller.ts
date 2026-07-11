import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { CreateLinkDto } from "./dto/create-link.dto";
import { LinksService } from "./links.service";

@Controller("links")
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(@Body() createLinkDto: CreateLinkDto) {
    return this.linksService.create(createLinkDto);
  }

  @Get()
  findAll() {
    return this.linksService.findAll();
  }

  @Get("alias/check")
  checkAlias(@Query("alias") alias: string) {
    return this.linksService.checkAlias(alias);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateLinkDto: CreateLinkDto) {
    return this.linksService.update(id, updateLinkDto);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.linksService.findOne(slug);
  }
}
