import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, MessageCircle, Store } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface ApplicationSummary {
  id: string
  shop_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_CONFIG = {
  pending:  { label: '審査中', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: '承認済', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: '却下',   badgeClass: 'bg-red-50 text-red-600 border-red-200' },
} as const

const useMyApplications = (userId: string | undefined) =>
  useQuery({
    queryKey: ['my-owner-applications-list', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_listing_requests')
        .select('id, shop_name, status, created_at')
        .eq('submitted_by', userId!)
        .eq('is_owner_request', true)
        .order('created_at', { ascending: false }) as unknown as {
          data: ApplicationSummary[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

const OwnerApplicationListPage = () => {
  const { user } = useAuth()
  const { data: applications, isLoading } = useMyApplications(user?.id)

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            DM
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl pb-6">
          <Link
            to="/mypage"
            className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
          >
            <ChevronLeft className="h-3 w-3" />
            マイページ
          </Link>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
            — MYPAGE
          </p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
            オーナー申請
          </h1>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-16 md:py-12">

          {isLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-sm bg-muted" />
              ))}
            </div>
          )}

          {!isLoading && applications?.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Store className="h-10 w-10 text-muted-foreground/15" />
              <div>
                <p className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                  No Applications
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/40">
                  まだオーナー申請はありません
                </p>
              </div>
              <Link
                to="/owner-application/new"
                className="mt-2 bg-primary px-6 py-2.5 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90"
              >
                申請する
              </Link>
            </div>
          )}

          {!isLoading && applications && applications.length > 0 && (
            <div className="space-y-2">
              {applications.map((app, i) => {
                const conf = STATUS_CONFIG[app.status]
                return (
                  <Link
                    key={app.id}
                    to={`/owner-application/${app.id}`}
                    className={cn(
                      'wish-card-enter group flex items-center gap-4 border px-5 py-4 transition-all editorial-shadow',
                      app.status === 'pending'
                        ? 'border-amber-200 bg-amber-50/60 hover:border-amber-300'
                        : 'border-border bg-white hover:border-primary/20 hover:bg-primary/[0.02]',
                    )}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm',
                      app.status === 'pending'
                        ? 'bg-amber-100 text-amber-600'
                        : app.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-muted text-muted-foreground',
                    )}>
                      <MessageCircle className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-foreground/80 truncate">
                          {app.shop_name}
                        </p>
                        <span className={cn(
                          'shrink-0 rounded-sm border px-1.5 py-0.5 font-headline text-[8px] font-black uppercase tracking-wider',
                          conf.badgeClass,
                        )}>
                          {conf.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                        {new Date(app.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                        })} 申請
                        {app.status === 'pending' && ' — FINDE運営とのDM'}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/20 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary/40" />
                  </Link>
                )
              })}
            </div>
          )}

          {!isLoading && applications && applications.length > 0 && (
            <div className="mt-8">
              <Link
                to="/owner-application/new"
                className="inline-flex items-center gap-2 border border-border bg-white px-5 py-2.5 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-foreground/60 transition-all hover:border-primary/30 hover:text-primary"
              >
                新規申請する
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default OwnerApplicationListPage
