import { useState } from 'react'
import { useParams, Link } from 'react-router'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { ChevronLeft, Eye, Users, Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useShopViewAnalytics } from '@/hooks/useShopViewAnalytics'
import { cn } from '@/lib/utils'
import type {
  ShopAnalyticsSourceCount,
  ShopAnalyticsActionCount,
  ShopAnalyticsItemCount,
} from '@/types'

// ── ラベル定義 ────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  search: '一覧検索',
  area: 'エリア',
  share: 'シャレ活',
  brand: 'ブランド',
  direct: '直接・外部',
}

const ACTION_LABELS: Record<string, string> = {
  phone: '電話',
  website: '公式サイト',
  instagram: 'Instagram',
  x: 'X',
  tiktok: 'TikTok',
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

// ── 期間セレクタ ──────────────────────────────────────────────

const PRESETS: { label: string; value: number }[] = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
]

const PeriodSelector = ({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) => (
  <div className="flex gap-1">
    {PRESETS.map((p) => (
      <button
        key={p.value}
        onClick={() => onChange(p.value)}
        className={cn(
          'px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-[0.2em] transition-colors',
          value === p.value
            ? 'bg-primary text-white'
            : 'border border-border text-muted-foreground/50 hover:border-primary/30 hover:text-foreground/70',
        )}
      >
        {p.label}
      </button>
    ))}
  </div>
)

// ── 前期間比較 ────────────────────────────────────────────────

const DeltaBadge = ({ current, prev }: { current: number; prev: number }) => {
  if (prev === 0) {
    return <span className="text-[10px] text-muted-foreground/40">—</span>
  }
  const pct = Math.round(((current - prev) / prev) * 100)
  const isUp = pct > 0
  const isFlat = pct === 0
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums',
        isFlat ? 'text-muted-foreground/50' : isUp ? 'text-emerald-600' : 'text-red-500',
      )}
    >
      <Icon className="h-3 w-3" />
      {isUp ? '+' : ''}
      {pct}%
    </span>
  )
}

// ── KPI カード ────────────────────────────────────────────────

const KpiCard = ({
  icon,
  label,
  value,
  prev,
}: {
  icon: React.ReactNode
  label: string
  value: number
  prev?: number
}) => (
  <div className="border border-border bg-white p-5 editorial-shadow">
    <div className="flex items-center gap-2 text-muted-foreground/40">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-[0.3em]">{label}</span>
    </div>
    <div className="mt-2 flex items-end justify-between gap-2">
      <p className="font-headline text-3xl font-black tabular-nums tracking-tight text-primary">
        {value.toLocaleString()}
      </p>
      {prev !== undefined && <DeltaBadge current={value} prev={prev} />}
    </div>
  </div>
)

// ── ランキングバー（流入元・アクション・アイテム共通） ──────────

interface RankItem {
  key: string
  label: string
  count: number
}

const RankList = ({ items }: { items: RankItem[] }) => {
  const max = items[0]?.count ?? 1
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const widthPct = Math.round((item.count / max) * 100)
        return (
          <div key={item.key} className="border border-border bg-white p-4 editorial-shadow">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/30">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="font-headline text-sm font-black tracking-tight text-foreground/80">
                  {item.label}
                </span>
              </div>
              <span className="font-headline text-sm font-black tabular-nums text-primary">
                {item.count.toLocaleString()}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary/40 transition-all"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── セクションラベル ──────────────────────────────────────────

const SectionLabel = ({ label }: { label: string }) => (
  <div className="mb-4 flex items-baseline gap-3">
    <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
      {label}
    </span>
    <span className="h-px flex-1 bg-border" />
  </div>
)

// ── 棒グラフカード（時間帯・曜日） ────────────────────────────

const DistributionChart = ({
  data,
}: {
  data: { label: string; count: number }[]
}) => (
  <div className="border border-border bg-white px-2 py-5 editorial-shadow">
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: '11px',
            border: '1px solid hsl(var(--border))',
            borderRadius: '2px',
          }}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
        />
        <Bar dataKey="count" name="件数" fill="oklch(0.18 0.004 250)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

// ── ページ ────────────────────────────────────────────────────

const OwnerShopAnalyticsPage = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const [days, setDays] = useState(30)
  const { data: analytics, isLoading, isError } = useShopViewAnalytics(shopId ?? '', days)

  const dailyChart = (analytics?.daily ?? []).map((d) => ({
    date: d.date.slice(5).replace('-', '/'),
    PV: d.pv,
    UU: d.uu,
  }))

  const sourceItems: RankItem[] = (analytics?.bySource ?? []).map((s: ShopAnalyticsSourceCount) => ({
    key: s.source,
    label: SOURCE_LABELS[s.source] ?? s.source,
    count: s.count,
  }))

  const actionItems: RankItem[] = (analytics?.actions ?? []).map((a: ShopAnalyticsActionCount) => ({
    key: a.type,
    label: ACTION_LABELS[a.type] ?? a.type,
    count: a.count,
  }))

  const topItems: RankItem[] = (analytics?.topItems ?? []).map((i: ShopAnalyticsItemCount) => ({
    key: i.itemId,
    label: i.name,
    count: i.count,
  }))

  const hourChart = (analytics?.byHour ?? []).map((h) => ({
    label: `${h.hour}`,
    count: h.count,
  }))

  const weekdayChart = (analytics?.byWeekday ?? []).map((w) => ({
    label: WEEKDAY_LABELS[w.weekday] ?? String(w.weekday),
    count: w.count,
  }))

  const hasData = (analytics?.totals.pv ?? 0) > 0

  return (
    <div className="min-h-[calc(100dvh-56px)]">
      {/* ── Page header ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            ACCESS
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to="/owner"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボードへ
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Owner</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              アクセス解析
            </h1>
          </div>
        </div>
      </section>

      {/* ── Description ────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 md:px-16">
          <p className="text-[11px] text-muted-foreground/60">
            店舗詳細ページの閲覧状況を集計しています。前の同じ期間との比較も表示します。
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 md:px-16 md:py-14">

          {/* Period selector */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              期間
            </p>
            <PeriodSelector value={days} onChange={setDays} />
          </div>

          {isLoading && (
            <div className="flex justify-center py-24">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {isError && (
            <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">データの取得に失敗しました。</p>
            </div>
          )}

          {!isLoading && !isError && analytics && (
            <>
              {/* KPI */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard
                  icon={<Eye className="h-3.5 w-3.5" />}
                  label="PV"
                  value={analytics.totals.pv}
                  prev={analytics.prevTotals.pv}
                />
                <KpiCard
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="UU"
                  value={analytics.totals.uu}
                  prev={analytics.prevTotals.uu}
                />
                <KpiCard
                  icon={<Heart className="h-3.5 w-3.5" />}
                  label="お気に入り"
                  value={analytics.favorites}
                />
              </div>

              {!hasData && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <Eye className="h-10 w-10 text-muted-foreground/15" />
                  <p className="text-sm text-muted-foreground/50">
                    この期間のアクセスデータはまだありません
                  </p>
                </div>
              )}

              {hasData && (
                <>
                  {/* PV/UU 推移 */}
                  <section>
                    <SectionLabel label="PV / UU の推移" />
                    <div className="border border-border bg-white px-2 py-5 editorial-shadow">
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={dailyChart} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              fontSize: '11px',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '2px',
                            }}
                            labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                          />
                          <Line type="monotone" dataKey="PV" stroke="oklch(0.18 0.004 250)" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                          <Line type="monotone" dataKey="UU" stroke="#10b981" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* 流入元 */}
                  {sourceItems.length > 0 && (
                    <section>
                      <SectionLabel label="流入元" />
                      <RankList items={sourceItems} />
                    </section>
                  )}

                  {/* アクション */}
                  {actionItems.length > 0 && (
                    <section>
                      <SectionLabel label="アクション（外部リンククリック）" />
                      <RankList items={actionItems} />
                    </section>
                  )}

                  {/* アイテム別閲覧ランキング */}
                  {topItems.length > 0 && (
                    <section>
                      <SectionLabel label="アイテム別閲覧 TOP10" />
                      <RankList items={topItems} />
                    </section>
                  )}

                  {/* 時間帯分布 */}
                  <section>
                    <SectionLabel label="時間帯分布（時）" />
                    <DistributionChart data={hourChart} />
                  </section>

                  {/* 曜日分布 */}
                  <section>
                    <SectionLabel label="曜日分布" />
                    <DistributionChart data={weekdayChart} />
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default OwnerShopAnalyticsPage
