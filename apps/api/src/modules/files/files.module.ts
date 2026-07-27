import { Module } from "@nestjs/common";

import { FilesController, PublicFilesController } from "./files.controller";
import { FilesService } from "./files.service";
import {
  LocalMultipartUploadStorage,
  MULTIPART_UPLOAD_STORAGE,
} from "./multipart-upload.storage";

@Module({
  controllers: [FilesController, PublicFilesController],
  providers: [
    FilesService,
    LocalMultipartUploadStorage,
    {
      provide: MULTIPART_UPLOAD_STORAGE,
      useExisting: LocalMultipartUploadStorage,
    },
  ],
  exports: [FilesService],
})
export class FilesModule {}
