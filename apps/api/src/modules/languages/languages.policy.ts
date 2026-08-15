import { BadRequestException } from "@nestjs/common";

import type { PublicationStatus } from "../../common/constants/publication-status";
import type { UpdateLanguageDto } from "./dto/update-language.dto";
import type { UpdateUiTranslationsDto } from "./dto/update-ui-translations.dto";
import { parseLanguageUiMessages } from "./languages.mapper";

export function assertDefaultLanguagePublished(
  isDefault: boolean,
  status: PublicationStatus,
) {
  if (isDefault && status !== "published") {
    throw new BadRequestException(
      "Ngôn ngữ mặc định phải ở trạng thái xuất bản.",
    );
  }
}

export function assertLanguageUpdateAllowed(
  existing: { isDefault: boolean; status: string },
  dto: UpdateLanguageDto,
) {
  if (existing.isDefault && dto.isDefault === false) {
    throw new BadRequestException(
      "Hãy đặt ngôn ngữ khác làm mặc định trước.",
    );
  }
  assertDefaultLanguagePublished(
    dto.isDefault ?? existing.isDefault,
    dto.status ?? toPublicationStatus(existing.status),
  );
}

export function mergeLanguageUiMessages(
  currentJson: string,
  dto: UpdateUiTranslationsDto,
) {
  const messages = parseLanguageUiMessages(currentJson);
  const removedKeys = new Set(dto.removedKeys ?? []);
  const seenKeys = new Set<string>();
  for (const entry of dto.entries) {
    if (!entry.value.trim()) continue;
    if (removedKeys.has(entry.key)) {
      throw new BadRequestException(
        `Translation key vừa cập nhật vừa xóa: ${entry.key}.`,
      );
    }
    if (seenKeys.has(entry.key)) {
      throw new BadRequestException(`Translation key bị trùng: ${entry.key}.`);
    }
    seenKeys.add(entry.key);
    messages[entry.key] = entry.value;
  }
  for (const key of removedKeys) delete messages[key];
  return messages;
}

export function assertUniqueLanguageOrder(ids: number[]) {
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestException("Language id không được trùng nhau.");
  }
}

export function assertRequiredTranslationLocales(
  locales: string[],
  languages: Array<{ locale: string; isDefault: boolean }>,
) {
  const uniqueLocales = [...new Set(locales)];
  if (uniqueLocales.length !== locales.length) {
    throw new BadRequestException("Mỗi ngôn ngữ chỉ được khai báo một lần.");
  }
  const known = new Set(languages.map(({ locale }) => locale));
  const unsupported = uniqueLocales.filter((locale) => !known.has(locale));
  if (unsupported.length) {
    throw new BadRequestException(
      `Locale không tồn tại: ${unsupported.join(", ")}.`,
    );
  }
  const defaultLocale = languages.find(({ isDefault }) => isDefault)?.locale;
  if (defaultLocale && !uniqueLocales.includes(defaultLocale)) {
    throw new BadRequestException(
      `Thiếu bản dịch bắt buộc cho locale mặc định "${defaultLocale}".`,
    );
  }
}

function toPublicationStatus(value: string): PublicationStatus {
  if (value === "draft" || value === "pending" || value === "published") {
    return value;
  }
  throw new BadRequestException("Trạng thái ngôn ngữ không hợp lệ.");
}
