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
    backgroundMediaType: "image" | "video" | "youtube" | null;
    backgroundMediaUrl: string | null;
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

export type SnippetDto = {
  id: string;
  name: string;
  content: string;
  copies: number;
  createdAt: string;
  updatedAt: string;
};

export type FilesResponseDto = {
  items: ManagedFileDto[];
  total: number;
  totalSize: number;
};

export type BioSocialLinkDto = {
  id: string;
  platform: string;
  url: string;
};

export type BioCustomLinkDto = {
  id: string;
  title: string;
  url: string;
};

export type BioWidgetDto = {
  id: string;
  type: string;
  title: string;
  url: string;
  description?: string;
};

export type BioAppearanceDto = {
  buttonStyle: string;
  backgroundColor: string;
  backgroundImage?: string | null;
};

export type BioPageDto = {
  id: string;
  slug: string;
  publicUrl: string;
  name: string;
  title: string | null;
  status: string;
  views: number;
  clicks: number;
  socialLinks: BioSocialLinkDto[];
  customLinks: BioCustomLinkDto[];
  widgets: BioWidgetDto[];
  hiddenLinks: string[];
  appearance: BioAppearanceDto;
  createdAt: string;
  updatedAt: string;
};

export type CreateBioPagePayload = {
  name: string;
  title?: string;
  customSlug?: string;
  status?: "published" | "draft";
  socialLinks: BioSocialLinkDto[];
  customLinks: BioCustomLinkDto[];
  widgets: BioWidgetDto[];
  hiddenLinks: string[];
  appearance: BioAppearanceDto;
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
    backgroundMediaType?: "image" | "video" | "youtube";
    backgroundMediaUrl?: string;
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

export async function updateLink(id: string, payload: CreateLinkPayload) {
  const response = await fetch(`${API_URL}/links/${id}`, {
    method: "PATCH",
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

export async function checkLinkAliasAvailability(alias: string) {
  const searchParams = new URLSearchParams({
    alias,
  });
  const response = await fetch(`${API_URL}/links/alias/check?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as {
    alias: string;
    available: boolean;
  };
}

export async function getSnippets() {
  const response = await fetch(`${API_URL}/snippets`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as SnippetDto[];
}

export async function createSnippet(payload: { name?: string; content: string }) {
  const response = await fetch(`${API_URL}/snippets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as SnippetDto;
}

export async function updateSnippet(
  id: string,
  payload: { name?: string; content?: string },
) {
  const response = await fetch(`${API_URL}/snippets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as SnippetDto;
}

export async function deleteSnippet(id: string) {
  const response = await fetch(`${API_URL}/snippets/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }
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

export async function uploadFile(
  file: File,
  options?: {
    purpose?: "file" | "cover";
  },
) {
  const formData = new FormData();
  formData.append("file", file);
  const searchParams = new URLSearchParams();

  if (options?.purpose) {
    searchParams.set("purpose", options.purpose);
  }

  const query = searchParams.toString();

  const response = await fetch(`${API_URL}/files${query ? `?${query}` : ""}`, {
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

export function getFilePreviewUrl(file: Pick<ManagedFileDto, "id">) {
  return absoluteApiUrl(`/files/${file.id}/download?disposition=inline`);
}

export async function createBioPage(payload: CreateBioPagePayload) {
  const response = await fetch(`${API_URL}/bio-pages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as BioPageDto;
}

export async function getBioPages() {
  const response = await fetch(`${API_URL}/bio-pages`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as BioPageDto[];
}

export async function getBioPage(slug: string) {
  const response = await fetch(`${API_URL}/bio-pages/${slug}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as BioPageDto;
}

export async function trackBioClick(slug: string) {
  const response = await fetch(`${API_URL}/bio-pages/${slug}/click`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as { clicks: number };
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
