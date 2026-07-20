import { Module } from "@nestjs/common";

import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import {
  LocalMultipartUploadStorage,
  MULTIPART_UPLOAD_STORAGE,
} from "./multipart-upload.storage";

@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
    LocalMultipartUploadStorage,
    {
      provide: MULTIPART_UPLOAD_STORAGE,
      useExisting: LocalMultipartUploadStorage,
    },
  ],
})
export class FilesModule {}
