import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { cn } from '@/lib/utils'
import { toYMD, type DateRange } from '@/lib/analyticsUtils'
import {
  useUserRegistrations,
  useShopAdditions,
  useListingRequests,
  useEngagement,
  useSubscriptions,
  useCustomRangeAnalytics,
} from '@/hooks/useAnalyticsData'
import { Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'

// ── 日付ユーティリティ ────────────────────────────────────────

function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toYMD(d)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toYMD(d)
}

// ── Period selector ───────────────────────────────────────────

type PeriodMode = DateRange | 'custom'

const PRESETS: { label: string; value: PeriodMode }[] = [
  { label: '7D',     value: 7 },
  { label: '30D',    value: 30 },
  { label: '90D',    value: 90 },
  { label: 'カスタム', value: 'custom' },
]

const PeriodSelector = ({
  value,
  onChange,
}: {
  value: PeriodMode
  onChange: (v: PeriodMode) => void
}) => (
  <div className="flex gap-1">
    {PRESETS.map((p) => (
      <button
        key={String(p.value)}
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

// ── Custom date range picker ──────────────────────────────────

const DateRangePicker = ({
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  start: string
  end: string
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
}) => (
  <div className="flex flex-wrap items-center gap-2 border border-border bg-white px-4 py-2.5 editorial-shadow">
    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
      期間
    </span>
    <input
      type="date"
      value={start}
      max={end}
      onChange={(e) => onStartChange(e.target.value)}
      className="rounded-sm border border-border px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
    />
    <span className="text-[10px] text-muted-foreground/40">〜</span>
    <input
      type="date"
      value={end}
      min={start}
      max={yesterday()}
      onChange={(e) => onEndChange(e.target.value)}
      className="rounded-sm border border-border px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
    />
    <span className="text-[9px] text-muted-foreground/30">
      ※ スナップショットデータを表示
    </span>
  </div>
)

// ── Chart card ────────────────────────────────────────────────

interface SeriesConfig {
  key: string
  color: string
  label: string
}

interface ChartCardProps {
  title: string
  description: string
  data: { date: string; [key: string]: string | number }[] | undefined
  isLoading: boolean
  series: SeriesConfig[]
  badges?: { label: string; value: number; color: string }[]
}

const ChartCard = ({ title, description, data, isLoading, series, badges }: ChartCardProps) => (
  <div className="border border-border bg-white editorial-shadow">
    <div className="border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/50">{description}</p>
        </div>
        {badges && (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                  {b.label}
                  <span className="ml-1 font-black text-foreground/80">{b.value}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="px-2 py-5">
      {isLoading ? (
        <div className="h-[200px] animate-pulse rounded-sm bg-muted/50" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: -24, bottom: 0 }}>
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
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              labelStyle={{ fontWeight: 700, marginBottom: 4 }}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
)

// ── Page ──────────────────────────────────────────────────────

const AdminAnalyticsPage = () => {
  const [mode, setMode] = useState<PeriodMode>(30)
  const [customStart, setCustomStart] = useState<string>(daysAgo(91))
  const [customEnd,   setCustomEnd]   = useState<string>(yesterday())

  const isCustom = mode === 'custom'
  const liveDays: DateRange = isCustom ? 30 : mode

  // ライブクエリ（7D / 30D / 90D）
  const { data: usersLive,   isLoading: usersLiveLoading }   = useUserRegistrations(liveDays, { enabled: !isCustom })
  const { data: shopsLive,   isLoading: shopsLiveLoading }   = useShopAdditions(liveDays,     { enabled: !isCustom })
  const { data: listingLive, isLoading: listingLiveLoading } = useListingRequests(liveDays,   { enabled: !isCustom })
  const { data: engageLive,  isLoading: engageLiveLoading }  = useEngagement(liveDays,        { enabled: !isCustom })
  const { data: subsLive,    isLoading: subsLiveLoading }    = useSubscriptions(liveDays,     { enabled: !isCustom })

  // カスタム期間クエリ（スナップショット）
  const { data: customData, isLoading: customLoading } = useCustomRangeAnalytics(
    customStart,
    customEnd,
    { enabled: isCustom },
  )

  // 表示するデータを切り替え
  const users   = isCustom ? customData?.users           : usersLive
  const shops   = isCustom ? customData?.shops           : shopsLive
  const listing = isCustom
    ? (customData ? { chartData: customData.listingRequests.chartData, totals: customData.listingRequests.totals } : undefined)
    : listingLive
  const engage  = isCustom
    ? (customData ? { chartData: customData.engagement.chartData, totals: customData.engagement.totals } : undefined)
    : engageLive
  const subs    = isCustom
    ? (customData ? { chartData: customData.subscriptions.chartData, totals: customData.subscriptions.totals } : undefined)
    : subsLive

  const isLoading = isCustom ? customLoading : (
    usersLiveLoading || shopsLiveLoading || listingLiveLoading || engageLiveLoading || subsLiveLoading
  )

  return (
    <div>
      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            ANALYTICS
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/admin"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボード
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — ADMIN
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              アナリティクス
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ───────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-16 md:py-14">

          {/* Period selector + date picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                期間
              </p>
              <PeriodSelector value={mode} onChange={setMode} />
            </div>
            {isCustom && (
              <DateRangePicker
                start={customStart}
                end={customEnd}
                onStartChange={setCustomStart}
                onEndChange={setCustomEnd}
              />
            )}
          </div>

          {/* Row 1: 2-col */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartCard
              title="User Registrations"
              description="新規ユーザー登録数 — 認知度・口コミの結果指標"
              data={users?.chartData}
              isLoading={isLoading}
              series={[{ key: 'users', color: 'oklch(0.18 0.004 250)', label: '登録数' }]}
              badges={[{ label: '合計', value: users?.total ?? 0, color: 'oklch(0.18 0.004 250)' }]}
            />
            <ChartCard
              title="Shop Additions"
              description="新規公開店舗数 — コンテンツ充実度の指標"
              data={shops?.chartData}
              isLoading={isLoading}
              series={[{ key: 'shops', color: '#10b981', label: '店舗数' }]}
              badges={[{ label: '合計', value: shops?.total ?? 0, color: '#10b981' }]}
            />
          </div>

          {/* Row 2: Listing requests full-width */}
          <ChartCard
            title="Listing Request Pipeline"
            description="掲載申請の推移 — 申請ペースと処理速度・承認率の把握"
            data={listing?.chartData}
            isLoading={isLoading}
            series={[
              { key: 'pending',  color: '#f59e0b', label: '審査中' },
              { key: 'approved', color: '#10b981', label: '承認' },
              { key: 'rejected', color: '#ef4444', label: '却下' },
            ]}
            badges={[
              { label: '審査中', value: listing?.totals.pending  ?? 0, color: '#f59e0b' },
              { label: '承認',   value: listing?.totals.approved ?? 0, color: '#10b981' },
              { label: '却下',   value: listing?.totals.rejected ?? 0, color: '#ef4444' },
            ]}
          />

          {/* Row 3: Engagement full-width */}
          <ChartCard
            title="Engagement"
            description="レビュー・お気に入り・ウィッシュの推移 — リテンションの代理指標"
            data={engage?.chartData}
            isLoading={isLoading}
            series={[
              { key: 'reviews',   color: '#3b82f6', label: 'レビュー' },
              { key: 'favorites', color: '#f43f5e', label: 'お気に入り' },
              { key: 'wishes',    color: '#8b5cf6', label: 'ウィッシュ' },
            ]}
            badges={[
              { label: 'レビュー',     value: engage?.totals.reviews   ?? 0, color: '#3b82f6' },
              { label: 'お気に入り',   value: engage?.totals.favorites ?? 0, color: '#f43f5e' },
              { label: 'ウィッシュ',   value: engage?.totals.wishes    ?? 0, color: '#8b5cf6' },
            ]}
          />

          {/* Row 4: Subscriptions */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ChartCard
              title="Subscriptions"
              description="新規サブスク・キャンセルの推移 — 収益成長の直接指標"
              data={subs?.chartData}
              isLoading={isLoading}
              series={[
                { key: 'newSubs',  color: 'oklch(0.18 0.004 250)', label: '新規' },
                { key: 'canceled', color: '#ef4444',                label: 'キャンセル' },
              ]}
              badges={[
                { label: '新規',       value: subs?.totals.newSubs  ?? 0, color: 'oklch(0.18 0.004 250)' },
                { label: 'キャンセル', value: subs?.totals.canceled ?? 0, color: '#ef4444' },
              ]}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

export default AdminAnalyticsPage
