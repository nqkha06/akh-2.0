export type LanguagePreset = {
  name: string;
  nativeName: string;
  locale: string;
  code: string;
  regional: string;
  flag: string;
  isRtl: boolean;
};

export const languageCatalog: LanguagePreset[] = [
  { name: "Vietnamese", nativeName: "Tiếng Việt", locale: "vi", code: "vi", regional: "vi-VN", flag: "VN", isRtl: false },
  { name: "English", nativeName: "English", locale: "en", code: "en", regional: "en-US", flag: "US", isRtl: false },
  { name: "Japanese", nativeName: "日本語", locale: "ja", code: "ja", regional: "ja-JP", flag: "JP", isRtl: false },
  { name: "Korean", nativeName: "한국어", locale: "ko", code: "ko", regional: "ko-KR", flag: "KR", isRtl: false },
  { name: "Simplified Chinese", nativeName: "简体中文", locale: "zh-CN", code: "zh", regional: "zh-CN", flag: "CN", isRtl: false },
  { name: "Thai", nativeName: "ไทย", locale: "th", code: "th", regional: "th-TH", flag: "TH", isRtl: false },
  { name: "Indonesian", nativeName: "Bahasa Indonesia", locale: "id", code: "id", regional: "id-ID", flag: "ID", isRtl: false },
  { name: "Malay", nativeName: "Bahasa Melayu", locale: "ms", code: "ms", regional: "ms-MY", flag: "MY", isRtl: false },
  { name: "Filipino", nativeName: "Filipino", locale: "fil", code: "fil", regional: "fil-PH", flag: "PH", isRtl: false },
  { name: "Hindi", nativeName: "हिन्दी", locale: "hi", code: "hi", regional: "hi-IN", flag: "IN", isRtl: false },
  { name: "Bengali", nativeName: "বাংলা", locale: "bn", code: "bn", regional: "bn-BD", flag: "BD", isRtl: false },
  { name: "Arabic", nativeName: "العربية", locale: "ar", code: "ar", regional: "ar-SA", flag: "SA", isRtl: true },
  { name: "Persian", nativeName: "فارسی", locale: "fa", code: "fa", regional: "fa-IR", flag: "IR", isRtl: true },
  { name: "Hebrew", nativeName: "עברית", locale: "he", code: "he", regional: "he-IL", flag: "IL", isRtl: true },
  { name: "Urdu", nativeName: "اردو", locale: "ur", code: "ur", regional: "ur-PK", flag: "PK", isRtl: true },
  { name: "Turkish", nativeName: "Türkçe", locale: "tr", code: "tr", regional: "tr-TR", flag: "TR", isRtl: false },
  { name: "German", nativeName: "Deutsch", locale: "de", code: "de", regional: "de-DE", flag: "DE", isRtl: false },
  { name: "French", nativeName: "Français", locale: "fr", code: "fr", regional: "fr-FR", flag: "FR", isRtl: false },
  { name: "Spanish", nativeName: "Español", locale: "es", code: "es", regional: "es-ES", flag: "ES", isRtl: false },
  { name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", locale: "pt-BR", code: "pt", regional: "pt-BR", flag: "BR", isRtl: false },
  { name: "Italian", nativeName: "Italiano", locale: "it", code: "it", regional: "it-IT", flag: "IT", isRtl: false },
  { name: "Dutch", nativeName: "Nederlands", locale: "nl", code: "nl", regional: "nl-NL", flag: "NL", isRtl: false },
  { name: "Russian", nativeName: "Русский", locale: "ru", code: "ru", regional: "ru-RU", flag: "RU", isRtl: false },
  { name: "Ukrainian", nativeName: "Українська", locale: "uk", code: "uk", regional: "uk-UA", flag: "UA", isRtl: false },
  { name: "Polish", nativeName: "Polski", locale: "pl", code: "pl", regional: "pl-PL", flag: "PL", isRtl: false },
  { name: "Czech", nativeName: "Čeština", locale: "cs", code: "cs", regional: "cs-CZ", flag: "CZ", isRtl: false },
  { name: "Romanian", nativeName: "Română", locale: "ro", code: "ro", regional: "ro-RO", flag: "RO", isRtl: false },
  { name: "Hungarian", nativeName: "Magyar", locale: "hu", code: "hu", regional: "hu-HU", flag: "HU", isRtl: false },
  { name: "Greek", nativeName: "Ελληνικά", locale: "el", code: "el", regional: "el-GR", flag: "GR", isRtl: false },
  { name: "Swedish", nativeName: "Svenska", locale: "sv", code: "sv", regional: "sv-SE", flag: "SE", isRtl: false },
  { name: "Norwegian", nativeName: "Norsk", locale: "no", code: "no", regional: "no-NO", flag: "NO", isRtl: false },
  { name: "Danish", nativeName: "Dansk", locale: "da", code: "da", regional: "da-DK", flag: "DK", isRtl: false },
  { name: "Finnish", nativeName: "Suomi", locale: "fi", code: "fi", regional: "fi-FI", flag: "FI", isRtl: false },
  { name: "Swahili", nativeName: "Kiswahili", locale: "sw", code: "sw", regional: "sw-KE", flag: "KE", isRtl: false },
].sort((a, b) => a.name.localeCompare(b.name));
