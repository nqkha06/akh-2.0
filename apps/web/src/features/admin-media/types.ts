export type AdminMedia = {
  id: string;
  folderId: string | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  sizeLabel: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  uploadedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminMediaFolder = {
  id: string;
  name: string;
  parentId: string | null;
  fileCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminMediaQuery = {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  folderId?: string | null | "all";
  sortBy?: "createdAt" | "fileName" | "size" | "mimeType";
  sortOrder?: "asc" | "desc";
};

export type AdminMediaResponse = {
  items: AdminMedia[];
  page: number;
  limit: number;
  total: number;
  pageCount: number;
};
