import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Store, User, CreditCard, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination'
import type { PageSizeOption } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'

// ── Types ──────────────────────────────────────────────────────

type SubStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
type SubPlan   = 'monthly' | 'yearly'

interface SubscriptionRow {
  id: string
  plan: SubPlan
  status: SubStatus
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  shops: { id: string; name: string } | null
  users: { id: string; display_name: string | null } | null
}

// ── Data hooks ─────────────────────────────────────────────────

type SubCounts = { all: number; active: number; trialing: number; past_due: number; canceled: number; yearly: number; expiringSoon: number }

const useSubCounts = () =>
  useQuery({
    queryKey: ['admin-sub-counts'],
    staleTime: 60_000,
    queryFn: async (): Promise<SubCounts> => {
      const [all, active, trialing, past_due, canceled, yearly] = await Promise.all([
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>,
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active') as unknown as Promise<{ count: number | null }>,
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'trialing') as unknown as Promise<{ count: number | null }>,
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'past_due') as unknown as Promise<{ count: number | null }>,
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'canceled') as unknown as Promise<{ count: number | null }>,
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('plan', 'yearly') as unknown as Promise<{ count: number | null }>,
      ])
      // expiringSoon computed client-side from active list (needs date comparison)
      return {
        all: all.count ?? 0, active: active.count ?? 0, trialing: trialing.count ?? 0,
        past_due: past_due.count ?? 0, canceled: canceled.count ?? 0,
        yearly: yearly.count ?? 0, expiringSoon: 0,
      }
    },
  })

const useAdminSubscriptions = (status: string, page: number, pageSize: number) =>
  useQuery({
    queryKey: ['admin-subscriptions', status, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let query = supabase
        .from('subscriptions')
        .select('id, plan, status, stripe_subscription_id, current_period_start, current_period_end, created_at, shops ( id, name ), users:user_id ( id, display_name )', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (status !== 'all') query = query.eq('status', status)

      const { data, count, error } = await (query as unknown as Promise<{ data: SubscriptionRow[] | null; count: number | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return { items: data ?? [], totalCount: count ?? 0 }
    },
  })

// ── Config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',      label: 'すべて' },
  { value: 'active',   label: 'アクティブ' },
  { value: 'trialing', label: 'トライアル' },
  { value: 'past_due', label: '支払い遅延' },
  { value: 'canceled', label: 'キャンセル済' },
] as const

const STATUS_CONFIG: Record<SubStatus, { label: string; borderClass: string; badgeClass: string }> = {
  active:   { label: 'アクティブ',  borderClass: 'border-l-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700' },
  trialing: { label: 'トライアル',  borderClass: 'border-l-blue-400',    badgeClass: 'bg-blue-50 text-blue-700' },
  past_due: { label: '支払い遅延',  borderClass: 'border-l-red-400',     badgeClass: 'bg-red-50 text-red-600' },
  canceled: { label: 'キャンセル済', borderClass: 'border-l-border',      badgeClass: 'bg-muted text-muted-foreground' },
}

const PLAN_CONFIG: Record<SubPlan, { label: string; badgeClass: string }> = {
  monthly: { label: '月額', badgeClass: 'bg-primary/10 text-primary' },
  yearly:  { label: '年額', badgeClass: 'bg-violet-50 text-violet-600' },
}

// ── Sub-components ─────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  accent?: 'default' | 'success' | 'warn' | 'danger'
  index: number
}

const STAT_ACCENT: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'border-l-border',
  success: 'border-l-emerald-400',
  warn:    'border-l-amber-400',
  danger:  'border-l-red-400',
}

const StatCard = ({ label, value, accent = 'default', index }: StatCardProps) => (
  <div
    className={cn('wish-card-enter border-l-[3px] bg-white p-5 editorial-shadow', STAT_ACCENT[accent])}
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{label}</p>
    <p className="font-headline text-3xl font-black leading-none tabular-nums tracking-tight text-foreground">
      {typeof value === 'number' ? String(value).padStart(2, '0') : value}
    </p>
  </div>
)

interface SubCardProps {
  sub: SubscriptionRow
  index: number
}

const isPeriodExpiringSoon = (end: string | null) => {
  if (!end) return false
  const daysLeft = (new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return daysLeft >= 0 && daysLeft <= 7
}

const SubCard = ({ sub, index }: SubCardProps) => {
  const statusConf = STATUS_CONFIG[sub.status]
  const planConf   = PLAN_CONFIG[sub.plan]
  const expiringSoon = sub.status === 'active' && isPeriodExpiringSoon(sub.current_period_end)

  return (
    <div
      className={cn(
        'wish-card-enter border-l-[3px] bg-white editorial-shadow',
        statusConf.borderClass,
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-3 px-4 py-4">
        {/* Index */}
        <span className="mt-0.5 w-7 shrink-0 font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Info */}
        <div className="min-w-0 flex-1">
          {/* Shop + badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 font-headline text-[13px] font-black tracking-tight text-foreground/80">
              <Store className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              {sub.shops?.name ?? '不明な店舗'}
            </span>
            <span className={cn('rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', planConf.badgeClass)}>
              {planConf.label}
            </span>
            {expiringSoon && (
              <span className="flex items-center gap-0.5 rounded-sm bg-amber-50 px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider text-amber-600">
                <AlertCircle className="h-2.5 w-2.5" />
                まもなく更新
              </span>
            )}
            {/* Status badge — mobile inline */}
            <span className={cn('sm:hidden rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', statusConf.badgeClass)}>
              {statusConf.label}
            </span>
          </div>

          {/* Meta */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <User className="h-2.5 w-2.5 shrink-0" />
              {sub.users?.display_name ?? '不明'}
            </span>
            {sub.current_period_end && (
              <span className={cn(
                'flex items-center gap-1 text-[10px] tabular-nums',
                expiringSoon ? 'text-amber-600' : 'text-muted-foreground/40',
              )}>
                <Calendar className="h-2.5 w-2.5 shrink-0" />
                次回更新: {new Date(sub.current_period_end).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' })}
              </span>
            )}
            {sub.stripe_subscription_id && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/30 tabular-nums">
                <CreditCard className="h-2.5 w-2.5 shrink-0" />
                {sub.stripe_subscription_id.slice(0, 20)}…
              </span>
            )}
            <span className="tabular-nums text-[10px] text-muted-foreground/25">
              {new Date(sub.created_at).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Status badge — desktop */}
        <span className={cn('hidden sm:inline-flex shrink-0 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', statusConf.badgeClass)}>
          {statusConf.label}
        </span>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const AdminSubscriptionsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])

  useEffect(() => { setPage(1) }, [statusFilter, pageSize])

  const { data, isLoading, error } = useAdminSubscriptions(statusFilter, page, pageSize)
  const { data: counts } = useSubCounts()

  const subscriptions = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handlePageSizeChange = (size: PageSizeOption) => { setPageSize(size); setPage(1) }

  // expiringSoon computed from current page items (approximate; full count not available without extra query)
  const yearlyCount  = counts?.yearly ?? 0
  const expiringSoon = subscriptions.filter((s) => s.status === 'active' && isPeriodExpiringSoon(s.current_period_end)).length

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            SUBS
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
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                  — Admin
                </p>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                  サブスクリプション
                </h1>
              </div>

              {(counts?.past_due ?? 0) > 0 && (
                <div className="flex items-center gap-2 rounded-sm border border-red-400/30 bg-red-400/10 px-3 py-2">
                  <AlertCircle className="h-3 w-3 text-red-300" />
                  <span className="font-headline text-[10px] font-black uppercase tracking-wider text-red-300">
                    {counts?.past_due ?? 0} 件支払い遅延
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="アクティブ"   value={counts?.active ?? 0}   accent="success" index={0} />
            <StatCard label="年額プラン"   value={yearlyCount}            accent="default" index={1} />
            <StatCard label="まもなく更新"  value={expiringSoon}           accent={expiringSoon > 0 ? 'warn' : 'default'} index={2} />
            <StatCard label="支払い遅延"   value={counts?.past_due ?? 0}  accent={(counts?.past_due ?? 0) > 0 ? 'danger' : 'default'} index={3} />
          </div>

          {/* Status filters */}
          <div className="mb-6 flex flex-wrap gap-1">
            {STATUS_FILTERS.map((f) => {
              const count = counts?.[f.value] ?? 0
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-wider transition-all',
                    statusFilter === f.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                  )}
                >
                  {f.label}
                  {count > 0 && (
                    <span className={cn(
                      'rounded-sm px-1 tabular-nums text-[9px]',
                      statusFilter === f.value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground/60',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && subscriptions.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                No Subscriptions
              </span>
              <p className="text-xs text-muted-foreground/50">該当するサブスクリプションがありません</p>
            </div>
          )}

          {/* List */}
          {!isLoading && subscriptions.length > 0 && (
            <div className="space-y-1.5">
              {subscriptions.map((sub, i) => (
                <SubCard key={sub.id} sub={sub} index={(page - 1) * pageSize + i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminSubscriptionsPage
