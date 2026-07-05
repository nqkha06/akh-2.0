export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export type LinkActionDto = {
  id?: string;
  platform: string;
  action: string;
  url: string;
};

export type LinkDto = {
  id: string;
  slug: string;
  shortUrl: string;
  destinationUrl: string;
  title: string;
  inputType: string;
  selectedSnippet: string | null;
  selectedFile: string | null;
  subtitle: string | null;
  customAlias: string | null;
  coverImageUrl: string | null;
  expiryEnabled: boolean;
  expiryType: string | null;
  expiryDate: string | null;
  expiryTime: string | null;
  maxClicks: number | null;
  clicks: number;
  status: string;
  actions: LinkActionDto[];
  backgroundSettings: {
    selectedBackgroundId: string | null;
    selectedBackgroundName: string | null;
    sameAsCoverImage: boolean;
    effects: {
      opacity: number;
      blur: number;
      saturation: number;
      contrast: number;
      grayscale: number;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export type ManagedFileDto = {
  id: string;
  alias: string;
  name: string;
  originalName: string;
  extension: string | null;
  mimeType: string;
  size: number;
  sizeLabel: string;
  isPublic: boolean;
  downloadCount: number;
  status: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FilesResponseDto = {
  items: ManagedFileDto[];
  total: number;
  totalSize: number;
};

export type CreateLinkPayload = {
  destinationUrl: string;
  title: string;
  inputType: "url" | "file" | "snippet";
  selectedSnippet?: string;
  selectedFile?: string;
  subtitle?: string;
  customAlias?: string;
  coverImageUrl?: string;
  expiryEnabled?: boolean;
  expiryType?: "date" | "clicks";
  expiryDate?: string;
  expiryTime?: string;
  maxClicks?: number;
  actions: LinkActionDto[];
  backgroundSettings?: {
    selectedBackgroundId?: string;
    selectedBackgroundName?: string;
    sameAsCoverImage?: boolean;
    effects?: {
      opacity?: number;
      blur?: number;
      saturation?: number;
      contrast?: number;
      grayscale?: number;
    };
  };
};

function absoluteApiUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function createLink(payload: CreateLinkPayload) {
  const response = await fetch(`${API_URL}/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as LinkDto;
}

export async function getLinks() {
  const response = await fetch(`${API_URL}/links`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as LinkDto[];
}

export async function getLink(slug: string) {
  const response = await fetch(`${API_URL}/links/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as LinkDto;
}

export async function getFiles(params?: {
  q?: string;
  sort?: "date" | "name" | "size" | "downloads";
  direction?: "asc" | "desc";
  status?: "active" | "trash";
}) {
  const searchParams = new URLSearchParams();

  if (params?.q) {
    searchParams.set("q", params.q);
  }

  if (params?.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params?.direction) {
    searchParams.set("direction", params.direction);
  }

  if (params?.status) {
    searchParams.set("status", params.status);
  }

  const query = searchParams.toString();
  const response = await fetch(`${API_URL}/files${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as FilesResponseDto;
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as ManagedFileDto;
}

export async function updateFile(
  id: string,
  payload: {
    name?: string;
    isPublic?: boolean;
  },
) {
  const response = await fetch(`${API_URL}/files/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as ManagedFileDto;
}

export async function deleteFile(id: string) {
  const response = await fetch(`${API_URL}/files/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as ManagedFileDto;
}

export function getFileDownloadUrl(file: Pick<ManagedFileDto, "id">) {
  return absoluteApiUrl(`/files/${file.id}/download`);
}

async function getApiError(response: Response) {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(", ");
    }

    return data.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
