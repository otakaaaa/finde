import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Store, FileText, Star, CreditCard, Tags, ArrowRight, Check, X, AlertTriangle, Mail, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ── Data hooks ───────────────────────────────────────────────

interface StatsData {
  shopsTotal: number
  shopsPublic: number
  shopsPending: number
  applicationsPending: number
  subscriptionsActive: number
  reviewsFlagged: number
}

const useAdminStats = () =>
  useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<StatsData> => {
      const [shopsAll, appsPending, subActive, reviewsFlagged] = await Promise.all([
        supabase.from('shops').select('status') as unknown as Promise<{ data: { status: string }[] | null; error: unknown }>,
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending') as unknown as Promise<{ count: number | null; error: unknown }>,
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active') as unknown as Promise<{ count: number | null; error: unknown }>,
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'flagged') as unknown as Promise<{ count: number | null; error: unknown }>,
      ])

      const shops = shopsAll.data ?? []
      return {
        shopsTotal: shops.length,
        shopsPublic: shops.filter((s) => s.status === 'public').length,
        shopsPending: shops.filter((s) => s.status === 'pending').length,
        applicationsPending: appsPending.count ?? 0,
        subscriptionsActive: subActive.count ?? 0,
        reviewsFlagged: reviewsFlagged.count ?? 0,
      }
    },
    staleTime: 60 * 1000,
  })

interface PendingApplication {
  id: string
  shop_name: string
  address: string | null
  is_owner_request: boolean
  created_at: string
  users: { display_name: string | null } | null
}

const usePendingApplications = () =>
  useQuery({
    queryKey: ['admin-pending-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_listing_requests')
        .select('id, shop_name, address, is_owner_request, created_at, users:submitted_by ( display_name )')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5) as unknown as { data: PendingApplication[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

// ── Sub-components ──────────────────────────────────────────

interface StatCardProps {
  value: number | string
  label: string
  sublabel?: string
  accent?: 'default' | 'warn' | 'danger' | 'success'
  index: number
}

const ACCENT_CLASS: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'border-border',
  warn: 'border-l-amber-400',
  danger: 'border-l-red-400',
  success: 'border-l-emerald-400',
}

const StatCard = ({ value, label, sublabel, accent = 'default', index }: StatCardProps) => (
  <div
    className={cn(
      'wish-card-enter border-l-[3px] bg-white p-5 editorial-shadow',
      ACCENT_CLASS[accent],
    )}
    style={{ animationDelay: `${index * 55}ms` }}
  >
    <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
      {label}
    </p>
    <p className="font-headline text-3xl font-black leading-none tabular-nums tracking-tight text-foreground">
      {typeof value === 'number' ? String(value).padStart(value >= 100 ? 3 : 2, '0') : value}
    </p>
    {sublabel && (
      <p className="mt-1.5 text-[10px] text-muted-foreground/50">{sublabel}</p>
    )}
  </div>
)

interface NavTileProps {
  to: string
  icon: React.ReactNode
  label: string
  sublabel: string
  badge?: number
  animDelay?: number
}

const NavTile = ({ to, icon, label, sublabel, badge, animDelay = 0 }: NavTileProps) => (
  <Link
    to={to}
    className="wish-card-enter group relative flex items-center gap-4 border border-border bg-white px-5 py-4 transition-all duration-150 hover:border-primary/20 hover:bg-primary/[0.02] editorial-shadow"
    style={{ animationDelay: `${animDelay}ms` }}
  >
    <div className={cn(
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground',
      'group-hover:bg-primary group-hover:text-white transition-colors duration-150',
    )}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-foreground/80">
        {label}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground/50">{sublabel}</p>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="flex h-5 min-w-5 items-center justify-center rounded-sm bg-amber-50 px-1.5 font-headline text-[10px] font-black tabular-nums text-amber-700">
        {badge}
      </span>
    )}
    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/20 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary/40" />
  </Link>
)

const PendingApplicationRow = ({
  app,
  onApprove,
  onReject,
  isPending,
}: {
  app: PendingApplication
  onApprove: () => void
  onReject: () => void
  isPending: boolean
}) => (
  <div className="flex items-center gap-3 border-b border-border/50 py-3 last:border-0">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-headline text-[12px] font-black tracking-tight text-foreground/80 truncate">
          {app.shop_name}
        </span>
        {app.is_owner_request && (
          <span className="shrink-0 rounded-sm bg-primary/[0.07] px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider text-primary">
            Owner
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[10px] text-muted-foreground/50 truncate">
        {app.users?.display_name ?? '不明'} · {new Date(app.created_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
        {app.address && ` · ${app.address}`}
      </p>
    </div>
    <div className="flex shrink-0 gap-1.5">
      <button
        onClick={onApprove}
        disabled={isPending}
        className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
        title="承認"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onReject}
        disabled={isPending}
        className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-muted-foreground transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
        title="却下"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
)

// ── Main component ──────────────────────────────────────────

const AdminDashboardPage = () => {
  const queryClient = useQueryClient()
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: pendingApps, isLoading: appsLoading } = usePendingApplications()

  const { mutate: updateAppStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      const { error } = await supabase
        .from('shop_listing_requests')
        .update({ status } as never)
        .eq('id', requestId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            ADMIN
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — Control Panel
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              DASHBOARD
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14 space-y-12">

          {/* ── Stats grid ───────────────────────── */}
          <section>
            <div className="mb-5 flex items-baseline gap-3">
              <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Stats</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {statsLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-sm bg-muted" style={{ animationDelay: `${i * 55}ms` }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
                <StatCard
                  value={stats?.shopsTotal ?? 0}
                  label="Total Shops"
                  sublabel={`公開 ${stats?.shopsPublic ?? 0} / 審査中 ${stats?.shopsPending ?? 0}`}
                  accent={stats?.shopsPending ? 'warn' : 'default'}
                  index={0}
                />
                <StatCard
                  value={stats?.applicationsPending ?? 0}
                  label="Applications"
                  sublabel="承認待ちの申請"
                  accent={stats?.applicationsPending ? 'warn' : 'default'}
                  index={1}
                />
                <StatCard
                  value={stats?.subscriptionsActive ?? 0}
                  label="Active Subs"
                  sublabel="有効なサブスク"
                  accent="success"
                  index={2}
                />
                <StatCard
                  value={stats?.reviewsFlagged ?? 0}
                  label="Flagged Reviews"
                  sublabel="要確認のレビュー"
                  accent={stats?.reviewsFlagged ? 'danger' : 'default'}
                  index={3}
                />
              </div>
            )}
          </section>

          {/* ── Two-column main ──────────────────── */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px] lg:gap-12">

            {/* Navigation tiles */}
            <section>
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Sections</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2">
                <NavTile
                  to="/admin/shops"
                  icon={<Store className="h-4 w-4" />}
                  label="店舗管理"
                  sublabel="公開・審査中・非公開の店舗を管理"
                  badge={stats?.shopsPending}
                  animDelay={0}
                />
                <NavTile
                  to="/admin/applications"
                  icon={<FileText className="h-4 w-4" />}
                  label="掲載申請"
                  sublabel="ユーザーからの申請を審査する"
                  badge={stats?.applicationsPending}
                  animDelay={55}
                />
                <NavTile
                  to="/admin/reviews"
                  icon={<Star className="h-4 w-4" />}
                  label="レビュー管理"
                  sublabel="通報されたレビューを審査する"
                  badge={stats?.reviewsFlagged}
                  animDelay={110}
                />
                <NavTile
                  to="/admin/brands"
                  icon={<Tags className="h-4 w-4" />}
                  label="ブランド管理"
                  sublabel="ブランドの追加・統合・管理"
                  animDelay={165}
                />
                <NavTile
                  to="/admin/subscriptions"
                  icon={<CreditCard className="h-4 w-4" />}
                  label="サブスクリプション"
                  sublabel="契約状況の確認"
                  animDelay={220}
                />
                <NavTile
                  to="/admin/contacts"
                  icon={<Mail className="h-4 w-4" />}
                  label="お問い合わせ"
                  sublabel="ユーザーからの問い合わせ対応"
                  animDelay={275}
                />
                <NavTile
                  to="/admin/users"
                  icon={<Users className="h-4 w-4" />}
                  label="ユーザー管理"
                  sublabel="ユーザーの一覧確認・ロール変更"
                  animDelay={330}
                />
              </div>
            </section>

            {/* Pending applications preview */}
            <section>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Pending</span>
                  <span className="h-px w-6 bg-border" />
                </div>
                <Link
                  to="/admin/applications"
                  className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 transition-colors hover:text-primary"
                >
                  View All →
                </Link>
              </div>

              <div className="border border-border bg-white editorial-shadow">
                {appsLoading ? (
                  <div className="p-5 space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-10 animate-pulse rounded-sm bg-muted" />
                    ))}
                  </div>
                ) : pendingApps && pendingApps.length > 0 ? (
                  <div className="px-5 py-3">
                    {pendingApps.map((app) => (
                      <PendingApplicationRow
                        key={app.id}
                        app={app}
                        onApprove={() => updateAppStatus({ requestId: app.id, status: 'approved' })}
                        onReject={() => updateAppStatus({ requestId: app.id, status: 'rejected' })}
                        isPending={isUpdating}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-5 py-10">
                    <AlertTriangle className="h-5 w-5 text-muted-foreground/20" />
                    <p className="text-[11px] font-medium text-muted-foreground/40">
                      保留中の申請はありません
                    </p>
                  </div>
                )}
              </div>

              {/* Quick add */}
              <div className="mt-3 flex gap-2">
                <Link
                  to="/admin/shops/new"
                  className="flex flex-1 items-center justify-center gap-1.5 border border-border bg-white py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-primary/20 hover:text-primary editorial-shadow"
                >
                  <Store className="h-3 w-3" />
                  新規店舗登録
                </Link>
                <Link
                  to="/admin/shops/bulk"
                  className="flex flex-1 items-center justify-center gap-1.5 border border-border bg-white py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-primary/20 hover:text-primary editorial-shadow"
                >
                  CSV
                </Link>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
