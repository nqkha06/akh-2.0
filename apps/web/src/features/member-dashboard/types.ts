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
