export type Language = {
  id: number;
  name: string;
  nativeName: string | null;
  locale: string;
  code: string;
  regional: string | null;
  flag: string | null;
  isDefault: boolean;
  isEnabled: boolean;
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
    Omit<Language, "isEnabled"> & {
      isEnabled?: never;
    }
  >;
  defaultLocale: string | null;
};
