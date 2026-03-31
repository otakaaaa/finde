import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Check, X, ExternalLink, User, MapPin, Globe, FileText, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────

interface ListingRequestRow {
  id: string
  shop_name: string
  address: string | null
  website_url: string | null
  note: string | null
  is_owner_request: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  users: { display_name: string | null } | null
}

// ── Data hooks ─────────────────────────────────────────────────

const useListingRequests = (status: string) =>
  useQuery({
    queryKey: ['admin-listing-requests', status],
    queryFn: async () => {
      let query = supabase
        .from('shop_listing_requests')
        .select('id, shop_name, address, website_url, note, is_owner_request, status, created_at, users:submitted_by ( display_name )')
        .order('created_at', { ascending: false })
        .limit(100)

      if (status !== 'all') query = query.eq('status', status)

      const { data, error } = await (query as unknown as Promise<{ data: ListingRequestRow[] | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

// ── Config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',      label: 'すべて' },
  { value: 'pending',  label: '審査中' },
  { value: 'approved', label: '承認済' },
  { value: 'rejected', label: '却下' },
] as const

const STATUS_CONFIG: Record<ListingRequestRow['status'], { label: string; borderClass: string; badgeClass: string }> = {
  pending:  { label: '審査中', borderClass: 'border-l-amber-400',   badgeClass: 'bg-amber-50 text-amber-700' },
  approved: { label: '承認済', borderClass: 'border-l-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '却下',   borderClass: 'border-l-red-300',     badgeClass: 'bg-red-50 text-red-600' },
}

// ── Sub-components ─────────────────────────────────────────────

interface RequestRowProps {
  req: ListingRequestRow
  index: number
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isUpdating: boolean
}

const RequestRow = ({ req, index, onApprove, onReject, isUpdating }: RequestRowProps) => {
  const conf = STATUS_CONFIG[req.status]
  const isPending = req.status === 'pending'

  return (
    <div
      className={cn(
        'wish-card-enter group relative border-l-[3px] bg-white editorial-shadow',
        conf.borderClass,
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Main content */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          {/* Index */}
          <span className="mt-0.5 w-7 shrink-0 font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* Info */}
          <div className="min-w-0 flex-1">
            {/* Shop name + badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-headline text-[13px] font-black tracking-tight text-foreground/80">
                {req.shop_name}
              </p>
              {req.is_owner_request && (
                <span className="rounded-sm bg-blue-50 px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider text-blue-600">
                  Owner
                </span>
              )}
              {/* Status badge — mobile inline */}
              <span className={cn('sm:hidden rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
                {conf.label}
              </span>
            </div>

            {/* Meta */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {req.address && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {req.address}
                </span>
              )}
              {req.website_url && (
                <a
                  href={req.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground/60 transition-colors hover:text-primary"
                >
                  <Globe className="h-2.5 w-2.5 shrink-0" />
                  {req.website_url}
                  <ExternalLink className="h-2 w-2" />
                </a>
              )}
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                <User className="h-2.5 w-2.5 shrink-0" />
                {req.users?.display_name ?? '不明'}
              </span>
              <span className="flex items-center gap-1 tabular-nums text-[10px] text-muted-foreground/30">
                <Clock className="h-2.5 w-2.5 shrink-0" />
                {new Date(req.created_at).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' })}
              </span>
            </div>

            {/* Note */}
            {req.note && (
              <div className="mt-2.5 flex items-start gap-1.5 rounded-sm bg-muted/40 px-2.5 py-2">
                <FileText className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
                <p className="text-[10px] leading-relaxed text-muted-foreground/60">{req.note}</p>
              </div>
            )}
          </div>

          {/* Status badge — desktop */}
          <span className={cn('hidden sm:inline-flex shrink-0 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
            {conf.label}
          </span>

          {/* Actions — mobile always visible */}
          {isPending && (
            <div className="flex sm:hidden shrink-0 items-center gap-1.5">
              <button
                onClick={() => onApprove(req.id)}
                disabled={isUpdating}
                title="承認"
                className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onReject(req.id)}
                disabled={isUpdating}
                title="却下"
                className="flex h-7 w-7 items-center justify-center rounded-sm bg-red-50 text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions — desktop hover */}
      {isPending && (
        <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            onClick={() => onApprove(req.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-emerald-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
          >
            <Check className="h-3 w-3" />
            承認
          </button>
          <button
            onClick={() => onReject(req.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-red-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
          >
            <X className="h-3 w-3" />
            却下
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const AdminApplicationsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('pending')

  const { data: requests, isLoading, error } = useListingRequests(statusFilter)
  const { data: allRequests } = useListingRequests('all')

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      const { error } = await supabase
        .from('shop_listing_requests')
        .update({ status } as never)
        .eq('id', requestId) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listing-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const counts = {
    all:      allRequests?.length ?? 0,
    pending:  allRequests?.filter((r) => r.status === 'pending').length ?? 0,
    approved: allRequests?.filter((r) => r.status === 'approved').length ?? 0,
    rejected: allRequests?.filter((r) => r.status === 'rejected').length ?? 0,
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            APPLY
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/admin"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              Dashboard
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                  — Admin
                </p>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                  APPLICATIONS
                </h1>
              </div>

              {counts.pending > 0 && (
                <div className="flex items-center gap-2 rounded-sm border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  <span className="font-headline text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {counts.pending} 件審査待ち
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

          {/* Control bar */}
          <div className="mb-6 flex gap-1">
            {STATUS_FILTERS.map((f) => {
              const count = counts[f.value]
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
          {!isLoading && !error && requests?.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                No Applications
              </span>
              <p className="text-xs text-muted-foreground/50">該当する申請がありません</p>
            </div>
          )}

          {/* List */}
          {!isLoading && (requests?.length ?? 0) > 0 && (
            <div className="space-y-2">
              {requests?.map((req, i) => (
                <RequestRow
                  key={req.id}
                  req={req}
                  index={i}
                  onApprove={(id) => updateStatus({ requestId: id, status: 'approved' })}
                  onReject={(id) => updateStatus({ requestId: id, status: 'rejected' })}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminApplicationsPage
