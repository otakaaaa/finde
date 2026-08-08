export type DateRange = 7 | 30 | 90

export interface ChartPoint {
  date: string
  [key: string]: string | number
}

export interface SnapshotMetrics {
  users: number
  shops: number
  listing_requests: { pending: number; approved: number; rejected: number }
  follows?: number
  /** 旧キー（2026-07 リネーム前のスナップショット互換） */
  favorites?: number
  wishes: number
  subscriptions: { new: number; canceled: number }
}

export function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLabel(ymd: string): string {
  const [, m, d] = ymd.split('-')
  return `${Number(m)}/${Number(d)}`
}

export function generateDateSeries(days: DateRange): string[] {
  const series: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    series.push(toYMD(d))
  }
  return series
}

export function groupByDay(records: { created_at: string }[]): Record<string, number> {
  return records.reduce<Record<string, number>>((acc, r) => {
    const day = r.created_at.slice(0, 10)
    acc[day] = (acc[day] ?? 0) + 1
    return acc
  }, {})
}

export function toChartData(
  series: string[],
  maps: Record<string, Record<string, number>>,
): ChartPoint[] {
  return series.map((ymd) => {
    const point: ChartPoint = { date: toLabel(ymd) }
    for (const [key, map] of Object.entries(maps)) {
      point[key] = map[ymd] ?? 0
    }
    return point
  })
}

export function sumValues(map: Record<string, number>): number {
  return Object.values(map).reduce((a, b) => a + b, 0)
}

// ── スナップショット変換 ───────────────────────────────────────

export interface SnapshotAllChartData {
  users:           { chartData: ChartPoint[]; total: number }
  shops:           { chartData: ChartPoint[]; total: number }
  listingRequests: { chartData: ChartPoint[]; totals: { pending: number; approved: number; rejected: number } }
  engagement:      { chartData: ChartPoint[]; totals: { follows: number; wishes: number } }
  subscriptions:   { chartData: ChartPoint[]; totals: { newSubs: number; canceled: number } }
}

export function snapshotsToAllChartData(
  snapshots: { date: string; metrics: SnapshotMetrics }[],
): SnapshotAllChartData {
  const usersMap:    Record<string, number> = {}
  const shopsMap:    Record<string, number> = {}
  const pendingMap:  Record<string, number> = {}
  const approvedMap: Record<string, number> = {}
  const rejectedMap: Record<string, number> = {}
  const followsMap:Record<string, number> = {}
  const wishesMap:   Record<string, number> = {}
  const newSubsMap:  Record<string, number> = {}
  const canceledMap: Record<string, number> = {}

  for (const s of snapshots) {
    const d = s.date
    usersMap[d]     = s.metrics.users
    shopsMap[d]     = s.metrics.shops
    pendingMap[d]   = s.metrics.listing_requests.pending
    approvedMap[d]  = s.metrics.listing_requests.approved
    rejectedMap[d]  = s.metrics.listing_requests.rejected
    followsMap[d] = s.metrics.follows ?? s.metrics.favorites ?? 0
    wishesMap[d]    = s.metrics.wishes
    newSubsMap[d]   = s.metrics.subscriptions.new
    canceledMap[d]  = s.metrics.subscriptions.canceled
  }

  const series = snapshots.map((s) => s.date)

  return {
    users: {
      chartData: toChartData(series, { users: usersMap }),
      total: sumValues(usersMap),
    },
    shops: {
      chartData: toChartData(series, { shops: shopsMap }),
      total: sumValues(shopsMap),
    },
    listingRequests: {
      chartData: toChartData(series, { pending: pendingMap, approved: approvedMap, rejected: rejectedMap }),
      totals: {
        pending:  sumValues(pendingMap),
        approved: sumValues(approvedMap),
        rejected: sumValues(rejectedMap),
      },
    },
    engagement: {
      chartData: toChartData(series, { follows: followsMap, wishes: wishesMap }),
      totals: {
        follows: sumValues(followsMap),
        wishes:    sumValues(wishesMap),
      },
    },
    subscriptions: {
      chartData: toChartData(series, { newSubs: newSubsMap, canceled: canceledMap }),
      totals: {
        newSubs:  sumValues(newSubsMap),
        canceled: sumValues(canceledMap),
      },
    },
  }
}
