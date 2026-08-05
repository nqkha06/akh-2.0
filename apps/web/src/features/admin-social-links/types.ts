export type AdminSocialLinkStatus = "active" | "inactive" | "paused"
export type AdminSocialLinkDestinationType = "url" | "file" | "snippet"
export type AdminSocialLinkDeletionState = "active" | "deleted"

export type AdminSocialLinkOwner = {
  id: number
  name: string
  email: string
  avatar: string | null
}

export type AdminSocialLinkAction = {
  id: number
  platform: string
  action: string
  url: string
  position: number
}

export type AdminSocialLink = {
  id: number
  slug: string
  title: string
  subtitle: string | null
  status: AdminSocialLinkStatus
  destinationType: AdminSocialLinkDestinationType
  destinationUrl: string | null
  destinationFile: {
    id: string
    alias: string
    name: string
  } | null
  destinationSnippet: {
    id: string
    name: string
  } | null
  views: number
  revenue: string
  actionsCount: number
  platforms: string[]
  actions: AdminSocialLinkAction[]
  expiresAt: string | null
  maxClicks: number | null
  owner: AdminSocialLinkOwner
  deletedAt: string | null
  deletedState: AdminSocialLinkDeletionState
  createdAt: string
  updatedAt: string
}

export type AdminSocialLinkPayload = {
  title: string
  subtitle: string
  status: AdminSocialLinkStatus
  destinationUrl?: string
}

export type NestPaginatedAdminSocialLinksResponse = {
  items: AdminSocialLink[]
  total: number
  page: number
  limit: number
  totalViews: number
  totalRevenue: string
}

export type AdminSocialLinksTableData = {
  data: AdminSocialLink[]
  pageCount: number
  total: number
  totalViews: number
  totalRevenue: string
}
