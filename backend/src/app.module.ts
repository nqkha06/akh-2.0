import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/env.validation";

import { AuthModule } from "./auth/auth.module";
import { BioPagesModule } from "./bio-pages/bio-pages.module";
import { FilesModule } from "./files/files.module";
import { LinksModule } from "./links/links.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SnippetsModule } from "./snippets/snippets.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    BioPagesModule,
    FilesModule,
    LinksModule,
    SnippetsModule,
    UsersModule,
  ],
})
export class AppModule {}
