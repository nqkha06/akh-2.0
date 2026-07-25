export type AdminDashboardRange = "7d" | "30d" | "90d"

export type AdminDashboardBreakdownItem = {
  key: string
  count: number
}

export type AdminDashboardData = {
  range: AdminDashboardRange
  period: {
    from: string
    to: string
  }
  metrics: {
    membersTotal: number
    newMembers: number
    linksTotal: number
    activeLinks: number
    unlocks: number
    uniqueIps: number
  }
  operations: {
    pendingWithdrawals: number
    openTickets: number
  }
  series: Array<{
    date: string
    unlocks: number
  }>
  breakdowns: {
    countries: AdminDashboardBreakdownItem[]
    devices: AdminDashboardBreakdownItem[]
    browsers: AdminDashboardBreakdownItem[]
  }
  topLinks: Array<{
    id: number
    slug: string
    title: string
    unlocks: number
    user: {
      id: number
      name: string
      email: string
    }
  }>
  recentUnlocks: Array<{
    id: string
    countryCode: string
    deviceType: string
    browserFamily: string
    ipAddress: string | null
    createdAt: string
    link: {
      id: number
      slug: string
      title: string
      user: {
        id: number
        name: string
        email: string
      }
    }
  }>
}
