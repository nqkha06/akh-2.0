import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

import { BioPagesService } from "./bio-pages.service";
import { CreateBioPageDto } from "./dto/create-bio-page.dto";

@Controller("bio-pages")
export class BioPagesController {
  constructor(private readonly bioPagesService: BioPagesService) {}

  @Post()
  create(@Body() createBioPageDto: CreateBioPageDto) {
    return this.bioPagesService.create(createBioPageDto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateBioPageDto: CreateBioPageDto) {
    return this.bioPagesService.update(id, updateBioPageDto);
  }

  @Get()
  findAll() {
    return this.bioPagesService.findAll();
  }

  @Post(":slug/click")
  trackClick(@Param("slug") slug: string) {
    return this.bioPagesService.trackClick(slug);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.bioPagesService.findOne(slug);
  }
}
