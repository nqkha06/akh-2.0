import {
  isTerminalAuthError,
  readAuthError,
} from "@/lib/auth/auth-errors";
import { logoutAndRedirect } from "@/features/auth/api/auth.client";

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
  destinationFileName: string | null;
  subtitle: string | null;
  customAlias: string | null;
  coverImageUrl: string | null;
  expiryEnabled: boolean;
  expiryType: string | null;
  expiryDate: string | null;
  expiryTime: string | null;
  maxClicks: number | null;
  views: number;
  revenue: string;
  status: string;
  monetizationRedirectUrl?: string | null;
  visitToken?: string | null;
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
  referrer?: string | null;
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
  downloadCount: number;
  status: string;
  purpose: "file" | "cover";
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SnippetDto = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type SnippetsResponseDto = {
  items: SnippetDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export type FilesResponseDto = {
  items: ManagedFileDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    usedBytes: number;
    reservedBytes: number;
    limitBytes: number;
  };
  total: number;
  totalSize: number;
};

export type BioSocialLinkDto = {
  id: string;
  platform: string;
  url: string;
  enabled?: boolean;
};

export type BioCustomLinkDto = {
  id: string;
  title: string;
  url: string;
  animationEffect?: LinkAnimationEffect;
};

export type LinkAnimationEffect = "none" | "pulse" | "shake" | "bounce" | "glow";

export type BioWidgetDto = {
  id: string;
  type: string;
  title: string;
  url: string;
  description?: string;
  enabled?: boolean;
};

export type BioGalleryImageDto = {
  id: string;
  fileId: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  linkUrl?: string;
  openInNewTab?: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
};

export type BioGalleryBlockDto = {
  id: string;
  type: "gallery";
  title?: string;
  enabled: boolean;
  showTitle: boolean;
  displayMode: "grid" | "slider";
  aspectRatio: "1:1" | "4:5" | "16:9" | "original";
  columns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap: "sm" | "md" | "lg";
  radius: "none" | "sm" | "md" | "lg" | "full";
  showCaption: boolean;
  border: "none" | "subtle";
  shadow: "none" | "sm" | "md";
  images: BioGalleryImageDto[];
};

export type BioDividerBlockDto = {
  id: string;
  type: "divider";
  enabled: boolean;
  label?: string;
  showLabel: boolean;
  style: "solid" | "dashed" | "dotted";
  spacing: "sm" | "md" | "lg";
};

export type BioBankDetailsBlockDto = {
  id: string;
  type: "bank-details";
  enabled: boolean;
  title: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  note?: string;
  showCopyButton: boolean;
};

export type BioContentOrderItemDto = {
  type: "link" | "widget" | "gallery" | "social" | "divider" | "bank-details";
  id: string;
};

export type BioAppearanceDto = {
  buttonStyle: string;
  backgroundColor: string;
  backgroundImage?: string | null;
  backgroundMediaType?: "image" | "video" | "youtube" | null;
  backgroundMediaUrl?: string | null;
  backgroundFileId?: string | null;
  selectedBackgroundId?: string | null;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
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
  galleries: BioGalleryBlockDto[];
  dividers: BioDividerBlockDto[];
  bankDetails: BioBankDetailsBlockDto[];
  contentOrder: BioContentOrderItemDto[];
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
  galleries: BioGalleryBlockDto[];
  dividers: BioDividerBlockDto[];
  bankDetails: BioBankDetailsBlockDto[];
  contentOrder: BioContentOrderItemDto[];
  hiddenLinks: string[];
  appearance: Omit<BioAppearanceDto, "avatarUrl">;
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
  const callbackUrl = `${window.location.pathname}${window.location.search}`;
  const searchParams = new URLSearchParams({ callbackUrl });
  if (reason) searchParams.set("reason", reason);
  await logoutAndRedirect(`/login?${searchParams.toString()}`);
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
  const snippets: SnippetDto[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: "100",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const response = await authenticatedApiFetch(
      `/member/snippets?${searchParams.toString()}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(await getApiError(response));
    }

    const result = (await response.json()) as SnippetsResponseDto;
    snippets.push(...result.items);
    totalPages = result.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return snippets;
}

export async function createSnippet(payload: { name?: string; content: string }) {
  const response = await authenticatedApiFetch("/member/snippets", {
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
  const response = await authenticatedApiFetch(`/member/snippets/${id}`, {
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
  const response = await authenticatedApiFetch(`/member/snippets/${id}`, {
    method: "DELETE",
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
  if (visitor.referrer) {
    headers.set("referer", visitor.referrer);
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

export async function completeLinkVisit(slug: string, visitToken: string) {
  const response = await fetch(
    requestApiUrl(
      `/links/${encodeURIComponent(slug)}/visit/${encodeURIComponent(visitToken)}/complete`,
    ),
    {
      method: "POST",
      cache: "no-store",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as LinkDto;
}

export async function completePublicLinkVisit(
  slug: string,
  visitToken: string,
) {
  const response = await fetch(
    `/api/public/links/${encodeURIComponent(slug)}?visitToken=${encodeURIComponent(visitToken)}`,
    {
      method: "GET",
      cache: "no-store",
      keepalive: true,
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
  type?: "image" | "video" | "audio" | "document" | "archive" | "other";
  state?: "ready" | "processing" | "failed";
  page?: number;
  limit?: number;
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

  if (params?.type) searchParams.set("type", params.type);
  if (params?.state) searchParams.set("state", params.state);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const response = await fetch(
    requestApiUrl(`/member/files${query ? `?${query}` : ""}`),
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
    onFinalizing?: () => void;
  },
) {
  options?.onProgress?.(0);

  const initiateResponse = await fetch(requestApiUrl("/member/files/multipart"), {
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

    options?.onFinalizing?.();

    const completeResponse = await fetch(
      requestApiUrl(`/member/files/multipart/${upload.uploadId}/complete`),
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
    await fetch(requestApiUrl(`/member/files/multipart/${uploadId}`), {
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
      requestApiUrl(`/member/files/multipart/${uploadId}/parts/${partNumber}`),
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
  },
) {
  const response = await fetch(requestApiUrl(`/member/files/${id}`), {
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
  const response = await fetch(requestApiUrl(`/member/files/${id}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as ManagedFileDto;
}

export async function bulkDeleteFiles(ids: string[]) {
  const response = await fetch(requestApiUrl("/member/files/bulk-delete"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error(await getApiError(response));
  return (await response.json()) as { ids: string[]; deleted: true };
}

export function getFilePreviewUrl(file: Pick<ManagedFileDto, "id">) {
  return browserApiUrl(`/member/files/${file.id}/preview`);
}

export async function createBioPage(payload: CreateBioPagePayload) {
  const response = await authenticatedApiFetch("/member/bio-pages", {
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

export async function updateBioPage(id: string, payload: CreateBioPagePayload) {
  const response = await authenticatedApiFetch(`/member/bio-pages/${id}`, {
    method: "PATCH",
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
  const response = await authenticatedApiFetch("/member/bio-pages", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as BioPageDto[];
}

export async function getBioPageById(id: string) {
  const response = await authenticatedApiFetch(`/member/bio-pages/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as BioPageDto;
}

export async function deleteBioPage(id: string) {
  const response = await authenticatedApiFetch(`/member/bio-pages/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as { id: string; deleted: true };
}

export async function getBioPage(slug: string) {
  const response = await fetch(requestApiUrl(`/public/bio-pages/${slug}`), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getApiError(response));
  }

  return (await response.json()) as BioPageDto;
}

export async function trackBioClick(slug: string) {
  const response = await fetch(requestApiUrl(`/public/bio-pages/${slug}/click`), {
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
