import {
  isTerminalAuthError,
  readAuthError,
} from "@/lib/auth/auth-errors";

const BROWSER_API_URL = "/api/backend";

export type LinkActionDto = {
  id?: string;
  platform: string;
  action: string;
  url: string;
  position?: number;
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
  monetizationRedirectUrl?: string | null;
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

export type LinkVisitorContext = {
  countryCode?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
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
  backgroundMediaType?: "image" | "video" | "youtube" | null;
  backgroundMediaUrl?: string | null;
  selectedBackgroundId?: string | null;
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

function normalizeApiPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function requestApiUrl(path: string) {
  if (typeof window !== "undefined") {
    return browserApiUrl(path);
  }

  const serverApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
  if (!serverApiUrl) {
    throw new Error("Missing API_INTERNAL_URL environment variable.");
  }

  return `${serverApiUrl}${normalizeApiPath(path)}`;
}

function browserApiUrl(path: string) {
  return `${BROWSER_API_URL}${normalizeApiPath(path)}`;
}

async function endExpiredSession(reason?: string) {
  const { signOut } = await import("next-auth/react");
  await signOut({ redirect: false });
  const callbackUrl = `${window.location.pathname}${window.location.search}`;
  const searchParams = new URLSearchParams({ callbackUrl });
  if (reason) searchParams.set("reason", reason);
  window.location.assign(`/login?${searchParams.toString()}`);
}

export async function authenticatedApiFetch(path: string, init: RequestInit = {}) {
  if (typeof window === "undefined") {
    throw new Error(
      "Client API functions must call the Next.js BFF from the browser.",
    );
  }

  const response = await fetch(requestApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  });
  if (response.status === 401) {
    const authError = await readAuthError(response);
    if (isTerminalAuthError(authError.code)) {
      await endExpiredSession("session-expired");
    }
  }
  return response;
}

export async function registerAccount(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await fetch(requestApiUrl("/auth/register"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getApiError(response));
  return response.json();
}

export async function logoutAllDevices() {
  const response = await authenticatedApiFetch("/auth/logout-all", {
    method: "POST",
  });
  if (!response.ok) throw new Error(await getApiError(response));
}

export async function createLink(payload: CreateLinkPayload) {
  const response = await authenticatedApiFetch("/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as LinkDto;
}

export async function updateLink(id: string, payload: CreateLinkPayload) {
  const response = await authenticatedApiFetch(`/links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as LinkDto;
}

export async function getLinks() {
  const response = await authenticatedApiFetch("/links", {
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
  const response = await authenticatedApiFetch(`/links/alias/check?${searchParams.toString()}`, {
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

export async function updateLinkStatus(
  id: string,
  status: "active" | "inactive" | "paused",
) {
  const response = await authenticatedApiFetch(`/links/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as LinkDto;
}

export async function deleteLink(id: string) {
  const response = await authenticatedApiFetch(`/links/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as { id: string; deleted: true };
}

export async function getSnippets() {
  const response = await fetch(requestApiUrl("/snippets"), {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as SnippetDto[];
}

export async function createSnippet(payload: { name?: string; content: string }) {
  const response = await fetch(requestApiUrl("/snippets"), {
    method: "POST",
    credentials: "include",
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
  const response = await fetch(requestApiUrl(`/snippets/${id}`), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as SnippetDto;
}

export async function deleteSnippet(id: string) {
  const response = await fetch(requestApiUrl(`/snippets/${id}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }
}

export async function getLink(slug: string) {
  const response = await fetch(requestApiUrl(`/links/${slug}`), {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as LinkDto;
}

export async function recordLinkVisit(
  slug: string,
  visitor: LinkVisitorContext = {},
) {
  const headers = new Headers();
  if (visitor.countryCode) {
    headers.set("x-visitor-country", visitor.countryCode);
  }
  if (visitor.userAgent) {
    headers.set("user-agent", visitor.userAgent);
  }
  if (visitor.ipAddress) {
    headers.set("x-visitor-ip", visitor.ipAddress);
  }

  const response = await fetch(
    requestApiUrl(`/links/${encodeURIComponent(slug)}/visit`),
    {
      method: "POST",
      headers,
      cache: "no-store",
      credentials: "include",
    },
  );

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
  const response = await fetch(
    requestApiUrl(`/files${query ? `?${query}` : ""}`),
    {
      cache: "no-store",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as FilesResponseDto;
}

export async function uploadFile(
  file: File,
  options?: {
    purpose?: "file" | "cover";
    signal?: AbortSignal;
    onProgress?: (progress: number) => void;
  },
) {
  options?.onProgress?.(0);

  const initiateResponse = await fetch(requestApiUrl("/files/multipart"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      purpose: options?.purpose || "file",
    }),
    signal: options?.signal,
  });

  if (!initiateResponse.ok) {
    throw new Error(await getApiError(initiateResponse));
  }

  const upload = (await initiateResponse.json()) as {
    uploadId: string;
    partSize: number;
    totalParts: number;
  };
  const uploadId = upload.uploadId;

  try {
    for (let partNumber = 1; partNumber <= upload.totalParts; partNumber += 1) {
      const start = (partNumber - 1) * upload.partSize;
      const end = Math.min(start + upload.partSize, file.size);
      const chunk = file.slice(start, end);

      await uploadMultipartPart(
        upload.uploadId,
        partNumber,
        chunk,
        options?.signal,
        (loaded) => {
          const uploadedBytes = start + Math.min(loaded, chunk.size);
          options?.onProgress?.(Math.min(99, Math.round((uploadedBytes / file.size) * 100)));
        },
      );
    }

    const completeResponse = await fetch(
      requestApiUrl(`/files/multipart/${upload.uploadId}/complete`),
      {
        method: "POST",
        credentials: "include",
        signal: options?.signal,
      },
    );

    if (!completeResponse.ok) {
      throw new Error(await getApiError(completeResponse));
    }

    options?.onProgress?.(100);
    return (await completeResponse.json()) as ManagedFileDto;
  } catch (error) {
    await fetch(requestApiUrl(`/files/multipart/${uploadId}`), {
      method: "DELETE",
      credentials: "include",
      keepalive: true,
    }).catch(() => undefined);
    throw error;
  }
}

function uploadMultipartPart(
  uploadId: string,
  partNumber: number,
  chunk: Blob,
  signal: AbortSignal | undefined,
  onProgress: (loaded: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("chunk", chunk, `part-${partNumber}`);

    const cleanup = () => signal?.removeEventListener("abort", abortUpload);
    const abortUpload = () => xhr.abort();

    xhr.open(
      "POST",
      requestApiUrl(`/files/multipart/${uploadId}/parts/${partNumber}`),
    );
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(chunk.size);
        resolve();
        return;
      }
      reject(new Error(getXhrApiError(xhr)));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error("Không thể kết nối tới máy chủ upload."));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload đã bị hủy.", "AbortError"));
    };

    if (signal?.aborted) {
      reject(new DOMException("Upload đã bị hủy.", "AbortError"));
      return;
    }

    signal?.addEventListener("abort", abortUpload, { once: true });
    xhr.send(formData);
  });
}

function getXhrApiError(xhr: XMLHttpRequest) {
  try {
    const data = JSON.parse(xhr.responseText) as { message?: string | string[] };
    return Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || `Request failed with ${xhr.status}`;
  } catch {
    return `Request failed with ${xhr.status}`;
  }
}

export async function updateFile(
  id: string,
  payload: {
    name?: string;
    isPublic?: boolean;
  },
) {
  const response = await fetch(requestApiUrl(`/files/${id}`), {
    method: "PATCH",
    credentials: "include",
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
  const response = await fetch(requestApiUrl(`/files/${id}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as ManagedFileDto;
}

export function getFileDownloadUrl(file: Pick<ManagedFileDto, "id">) {
  return browserApiUrl(`/files/${file.id}/download`);
}

export function getFilePreviewUrl(file: Pick<ManagedFileDto, "id">) {
  return browserApiUrl(`/files/${file.id}/download?disposition=inline`);
}

export async function createBioPage(payload: CreateBioPagePayload) {
  const response = await fetch(requestApiUrl("/bio-pages"), {
    method: "POST",
    credentials: "include",
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

export async function updateBioPage(id: string, payload: CreateBioPagePayload) {
  const response = await fetch(requestApiUrl(`/bio-pages/${id}`), {
    method: "PATCH",
    credentials: "include",
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
  const response = await fetch(requestApiUrl("/bio-pages"), {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as BioPageDto[];
}

export async function getBioPage(slug: string) {
  const response = await fetch(requestApiUrl(`/bio-pages/${slug}`), {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as BioPageDto;
}

export async function trackBioClick(slug: string) {
  const response = await fetch(requestApiUrl(`/bio-pages/${slug}/click`), {
    method: "POST",
    credentials: "include",
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
