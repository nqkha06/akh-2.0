export type LinksTab = "overview" | "create" | "monetization";
export type LinkStatusFilter = "all" | "active" | "inactive" | "paused";
export type LinkTypeFilter = "all" | "url" | "file" | "snippet";
export type LinkSort = "newest" | "oldest" | "clicks-desc" | "title-asc" | "actions-desc";

export type LinkFilters = {
  query: string;
  status: LinkStatusFilter;
  inputType: LinkTypeFilter;
  platform: string;
  createdFrom: string;
  createdTo: string;
  minClicks: string;
  highPerformance: boolean;
  sort: LinkSort;
};

export const defaultLinkFilters: LinkFilters = {
  query: "",
  status: "all",
  inputType: "all",
  platform: "all",
  createdFrom: "",
  createdTo: "",
  minClicks: "",
  highPerformance: false,
  sort: "newest",
};
