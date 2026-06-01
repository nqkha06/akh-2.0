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
