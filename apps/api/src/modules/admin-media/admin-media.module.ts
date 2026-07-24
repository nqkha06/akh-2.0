import { Module } from "@nestjs/common";

import { AdminMediaFolderController } from "./admin-media-folder.controller";
import { AdminMediaFolderService } from "./admin-media-folder.service";
import {
  AdminMediaController,
  AdminMediaPublicController,
} from "./admin-media.controller";
import { AdminMediaService } from "./admin-media.service";
import { AdminMediaStorageService } from "./admin-media-storage.service";

@Module({
  controllers: [
    AdminMediaFolderController,
    AdminMediaController,
    AdminMediaPublicController,
  ],
  providers: [
    AdminMediaService,
    AdminMediaFolderService,
    AdminMediaStorageService,
  ],
  exports: [AdminMediaService],
})
export class AdminMediaModule {}
