import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { FilesModule } from "./files/files.module";
import { LinksModule } from "./links/links.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    FilesModule,
    LinksModule,
  ],
})
export class AppModule {}
