import { describe, it, expect } from 'vitest'
import { mapResult, type AnalyticsRpcResult } from './useShopViewAnalytics'

const baseRpc = (overrides: Partial<AnalyticsRpcResult> = {}): AnalyticsRpcResult => ({
  daily: [{ date: '2026-06-23', pv: 5, uu: 3 }],
  totals: { pv: 5, uu: 3 },
  prev_totals: { pv: 2, uu: 1 },
  by_source: [{ source: 'search', count: 4 }],
  actions: [{ type: 'phone', count: 2 }],
  favorites: 7,
  top_items: [{ itemId: 'i1', name: 'Jacket', count: 9 }],
  by_hour: [{ hour: 12, count: 3 }],
  by_weekday: [{ weekday: 1, count: 4 }],
  ...overrides,
})

describe('mapResult', () => {
  it('snake_case の RPC 結果を camelCase にマップする', () => {
    const result = mapResult(baseRpc())
    expect(result.totals).toEqual({ pv: 5, uu: 3 })
    expect(result.prevTotals).toEqual({ pv: 2, uu: 1 })
    expect(result.bySource).toEqual([{ source: 'search', count: 4 }])
    expect(result.favorites).toBe(7)
    expect(result.topItems).toEqual([{ itemId: 'i1', name: 'Jacket', count: 9 }])
    expect(result.byHour).toEqual([{ hour: 12, count: 3 }])
    expect(result.byWeekday).toEqual([{ weekday: 1, count: 4 }])
  })

  it('null フィールドは空配列・0 にフォールバックする', () => {
    const result = mapResult(
      baseRpc({
        daily: null,
        totals: null,
        prev_totals: null,
        by_source: null,
        actions: null,
        favorites: null,
        top_items: null,
        by_hour: null,
        by_weekday: null,
      }),
    )
    expect(result.daily).toEqual([])
    expect(result.totals).toEqual({ pv: 0, uu: 0 })
    expect(result.prevTotals).toEqual({ pv: 0, uu: 0 })
    expect(result.bySource).toEqual([])
    expect(result.actions).toEqual([])
    expect(result.favorites).toBe(0)
    expect(result.topItems).toEqual([])
    expect(result.byHour).toEqual([])
    expect(result.byWeekday).toEqual([])
  })
})
