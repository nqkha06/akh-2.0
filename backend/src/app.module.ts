import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module";
import { BioPagesModule } from "./bio-pages/bio-pages.module";
import { FilesModule } from "./files/files.module";
import { LinksModule } from "./links/links.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SnippetsModule } from "./snippets/snippets.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    BioPagesModule,
    FilesModule,
    LinksModule,
    SnippetsModule,
  ],
})
export class AppModule {}
