import type { PublicationStatus } from "@/types/publication-status";

export type Language = {
  id: number;
  name: string;
  nativeName: string | null;
  locale: string;
  code: string;
  regional: string | null;
  flag: string | null;
  isDefault: boolean;
  status: PublicationStatus;
  sortOrder: number;
  isRtl: boolean;
};

export type LanguagePayload = Omit<Language, "id">;

export type LanguagesResponse = {
  items: Language[];
  total: number;
  defaultLocale: string | null;
};

export type PublicLanguagesResponse = {
  items: Array<
    Omit<Language, "status"> & {
      status?: never;
    }
  >;
  defaultLocale: string | null;
};
