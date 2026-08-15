export const memberDashboardRanges = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "60d",
  "90d",
] as const

export type MemberDashboardRange = (typeof memberDashboardRanges)[number]

export function isMemberDashboardRange(
  value: unknown,
): value is MemberDashboardRange {
  return memberDashboardRanges.includes(value as MemberDashboardRange)
}

export type MemberDashboardBreakdownItem = {
  key: string
  count: number
}

export type MemberDashboardSeriesPoint = {
  date: string
  successfulOpens: number
  earnedViews: number
  revenue: number
  averageCpm: number
}

export type MemberDashboardData = {
  member: {
    name: string
    balance: string
  }
  analytics: {
    periodDays: number
    period: {
      from: string
      to: string
    }
    metrics: {
      revenue: number
      successfulOpens: number
      earnedViews: number
      averageCpm: number
    }
    changes?: {
      revenue: number | null
      successfulOpens: number | null
      earnedViews: number | null
      averageCpm: number | null
    }
    today: {
      revenue: number
      successfulOpens: number
      earnedViews: number
      averageCpm: number
    }
    series: MemberDashboardSeriesPoint[]
    breakdowns: {
      countries: MemberDashboardBreakdownItem[]
      devices: MemberDashboardBreakdownItem[]
      browsers: MemberDashboardBreakdownItem[]
    }
    topLinks: Array<{
      id: number
      slug: string
      title: string
      successfulOpens: number
      revenue: number
    }>
  }
}
