export const publicationStatuses = [
  "draft",
  "pending",
  "published",
] as const;

export type PublicationStatus = (typeof publicationStatuses)[number];
