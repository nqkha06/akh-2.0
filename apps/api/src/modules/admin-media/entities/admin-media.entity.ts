export type AdminMediaEntity = {
  id: string;
  folderId: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  uploadedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
};
