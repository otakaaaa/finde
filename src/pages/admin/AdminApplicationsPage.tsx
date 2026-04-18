import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Check, X, ExternalLink, User, MapPin, Globe,
  FileText, Clock, MessageCircle, Send, Store, Phone, ArrowLeft,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'

// ── Types ──────────────────────────────────────────────────────

interface ListingRequestRow {
  id: string
  shop_name: string
  address: string | null
  website_url: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  users: { display_name: string | null } | null
}

interface OwnerApplicationRow {
  id: string
  shop_name: string
  address: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  applicant_name: string | null
  applicant_phone: string | null
  applicant_role: 'owner' | 'manager' | null
  instagram_handle: string | null
  users: { display_name: string | null } | null
}

interface DmMessage {
  id: string
  sender_id: string
  body: string
  created_at: string
  users: { display_name: string | null; role: string } | null
}

// ── Data hooks ─────────────────────────────────────────────────

type AppCounts = { all: number; pending: number; approved: number; rejected: number }

const useListingRequestCounts = () =>
  useQuery({
    queryKey: ['admin-listing-counts'],
    staleTime: 60_000,
    queryFn: async (): Promise<AppCounts> => {
      const [all, pending, approved, rejected] = await Promise.all([
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('is_owner_request', false) as unknown as Promise<{ count: number | null }>,
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('is_owner_request', false).eq('status', 'pending') as unknown as Promise<{ count: number | null }>,
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('is_owner_request', false).eq('status', 'approved') as unknown as Promise<{ count: number | null }>,
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('is_owner_request', false).eq('status', 'rejected') as unknown as Promise<{ count: number | null }>,
      ])
      return { all: all.count ?? 0, pending: pending.count ?? 0, approved: approved.count ?? 0, rejected: rejected.count ?? 0 }
    },
  })

const useOwnerAppCounts = () =>
  useQuery({
    queryKey: ['admin-owner-app-counts'],
    staleTime: 60_000,
    queryFn: async (): Promise<AppCounts> => {
      const [all, pending, approved, rejected] = await Promise.all([
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('is_owner_request', true) as unknown as Promise<{ count: number | null }>,
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('is_owner_request', true).eq('status', 'pending') as unknown as Promise<{ count: number | null }>,
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('is_owner_request', true).eq('status', 'approved') as unknown as Promise<{ count: number | null }>,
        supabase.from('shop_listing_requests').select('id', { count: 'exact', head: true }).eq('is_owner_request', true).eq('status', 'rejected') as unknown as Promise<{ count: number | null }>,
      ])
      return { all: all.count ?? 0, pending: pending.count ?? 0, approved: approved.count ?? 0, rejected: rejected.count ?? 0 }
    },
  })

const useListingRequests = (status: string, page: number, pageSize: number) =>
  useQuery({
    queryKey: ['admin-listing-requests', status, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let q = supabase
        .from('shop_listing_requests')
        .select('id, shop_name, address, website_url, note, status, created_at, users:submitted_by ( display_name )', { count: 'exact' })
        .eq('is_owner_request', false)
        .order('created_at', { ascending: false })
        .range(from, to)
      if (status !== 'all') q = q.eq('status', status)
      const { data, count, error } = await (q as unknown as Promise<{ data: ListingRequestRow[] | null; count: number | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return { items: data ?? [], totalCount: count ?? 0 }
    },
  })

const useOwnerApplications = (status: string, page: number, pageSize: number) =>
  useQuery({
    queryKey: ['admin-owner-applications', status, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let q = supabase
        .from('shop_listing_requests')
        .select('id, shop_name, address, status, created_at, applicant_name, applicant_phone, applicant_role, instagram_handle, users:submitted_by ( display_name )', { count: 'exact' })
        .eq('is_owner_request', true)
        .order('created_at', { ascending: false })
        .range(from, to)
      if (status !== 'all') q = q.eq('status', status)
      const { data, count, error } = await (q as unknown as Promise<{ data: OwnerApplicationRow[] | null; count: number | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return { items: data ?? [], totalCount: count ?? 0 }
    },
  })

const useOwnerApplication = (id: string | null) =>
  useQuery({
    queryKey: ['admin-owner-application', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_listing_requests')
        .select('id, shop_name, address, status, created_at, applicant_name, applicant_phone, applicant_role, instagram_handle, users:submitted_by ( display_name )')
        .eq('id', id!)
        .single() as unknown as { data: OwnerApplicationRow | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      return data
    },
  })

const useDmMessages = (requestId: string | null) =>
  useQuery({
    queryKey: ['listing-request-messages', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_request_messages')
        .select('id, sender_id, body, created_at, users:sender_id ( display_name, role )')
        .eq('request_id', requestId!)
        .order('created_at', { ascending: true }) as unknown as {
          data: DmMessage[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return data ?? []
    },
    refetchInterval: 10_000,
  })

// ── Config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',      label: 'すべて' },
  { value: 'pending',  label: '審査中' },
  { value: 'approved', label: '承認済' },
  { value: 'rejected', label: '却下' },
] as const

type AppStatus = 'pending' | 'approved' | 'rejected'

const STATUS_CONFIG: Record<AppStatus, { label: string; borderClass: string; badgeClass: string }> = {
  pending:  { label: '審査中', borderClass: 'border-l-amber-400',   badgeClass: 'bg-amber-50 text-amber-700' },
  approved: { label: '承認済', borderClass: 'border-l-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '却下',   borderClass: 'border-l-red-300',     badgeClass: 'bg-red-50 text-red-600' },
}

// ── Shared: FilterBar ──────────────────────────────────────────

interface FilterBarProps {
  value: string
  counts: Record<string, number>
  onChange: (v: string) => void
  compact?: boolean
}

const FilterBar = ({ value, counts, onChange, compact }: FilterBarProps) => (
  <div className="flex flex-wrap gap-1">
    {STATUS_FILTERS.map((f) => {
      const count = counts[f.value] ?? 0
      return (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-sm border font-headline font-black uppercase tracking-wider transition-all',
            compact ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]',
            value === f.value
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-white text-muted-foreground hover:border-primary/30',
          )}
        >
          {f.label}
          {count > 0 && (
            <span className={cn(
              'rounded-sm px-1 tabular-nums',
              compact ? 'text-[8px]' : 'text-[9px]',
              value === f.value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground/60',
            )}>
              {count}
            </span>
          )}
        </button>
      )
    })}
  </div>
)

// ── Listing Request Row ────────────────────────────────────────

interface ListingRowProps {
  req: ListingRequestRow
  index: number
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isUpdating: boolean
}

const ListingRow = ({ req, index, onApprove, onReject, isUpdating }: ListingRowProps) => {
  const conf = STATUS_CONFIG[req.status]
  const isPending = req.status === 'pending'

  return (
    <div
      className={cn('wish-card-enter group relative border-l-[3px] bg-white editorial-shadow', conf.borderClass)}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 w-7 shrink-0 font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-headline text-[13px] font-black tracking-tight text-foreground/80">{req.shop_name}</p>
              <span className={cn('sm:hidden rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
                {conf.label}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {req.address && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />{req.address}
                </span>
              )}
              {req.website_url && (
                <a href={req.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-primary">
                  <Globe className="h-2.5 w-2.5" />{req.website_url}<ExternalLink className="h-2 w-2" />
                </a>
              )}
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                <User className="h-2.5 w-2.5" />{req.users?.display_name ?? '不明'}
              </span>
              <span className="flex items-center gap-1 tabular-nums text-[10px] text-muted-foreground/30">
                <Clock className="h-2.5 w-2.5" />
                {new Date(req.created_at).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' })}
              </span>
            </div>
            {req.note && (
              <div className="mt-2.5 flex items-start gap-1.5 rounded-sm bg-muted/40 px-2.5 py-2">
                <FileText className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
                <p className="text-[10px] leading-relaxed text-muted-foreground/60">{req.note}</p>
              </div>
            )}
          </div>
          <span className={cn('hidden sm:inline-flex shrink-0 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
            {conf.label}
          </span>
          {isPending && (
            <div className="flex sm:hidden shrink-0 items-center gap-1.5">
              <button onClick={() => onApprove(req.id)} disabled={isUpdating}
                className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white disabled:opacity-40">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onReject(req.id)} disabled={isUpdating}
                className="flex h-7 w-7 items-center justify-center rounded-sm bg-red-50 text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-40">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      {isPending && (
        <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => onApprove(req.id)} disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-emerald-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-emerald-700 hover:bg-emerald-600 hover:text-white disabled:opacity-40">
            <Check className="h-3 w-3" />承認
          </button>
          <button onClick={() => onReject(req.id)} disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-red-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-40">
            <X className="h-3 w-3" />却下
          </button>
        </div>
      )}
    </div>
  )
}

// ── Owner Application List Item ────────────────────────────────

interface OwnerAppItemProps {
  app: OwnerApplicationRow
  index: number
  isSelected: boolean
  onSelect: () => void
}

const OwnerAppItem = ({ app, index, isSelected, onSelect }: OwnerAppItemProps) => {
  const conf = STATUS_CONFIG[app.status]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'wish-card-enter w-full border-l-[3px] text-left transition-colors',
        conf.borderClass,
        isSelected ? 'bg-primary/[0.05]' : 'bg-white hover:bg-muted/30',
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 w-6 shrink-0 font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn(
              'truncate font-headline text-[12px] font-black tracking-tight',
              isSelected ? 'text-primary' : 'text-foreground/80',
            )}>
              {app.shop_name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <User className="h-2.5 w-2.5" />
                {app.applicant_name ?? app.users?.display_name ?? '不明'}
              </span>
              <span className="flex items-center gap-1 tabular-nums text-[10px] text-muted-foreground/30">
                <Clock className="h-2.5 w-2.5" />
                {new Date(app.created_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
              </span>
            </div>
          </div>
          <span className={cn('shrink-0 rounded-sm px-1.5 py-0.5 font-headline text-[8px] font-black uppercase tracking-wider', conf.badgeClass)}>
            {conf.label}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Owner DM Pane ──────────────────────────────────────────────

interface OwnerDmPaneProps {
  application: OwnerApplicationRow
  onClose: () => void
}

const OwnerDmPane = ({ application, onClose }: OwnerDmPaneProps) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const conf = STATUS_CONFIG[application.status]
  const isPending = application.status === 'pending'

  const { data: messages, isLoading: msgsLoading } = useDmMessages(application.id)

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages])

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('listing_request_messages')
        .insert({ request_id: application.id, sender_id: user.id, body } as never) as unknown as {
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      setInputValue('')
      queryClient.invalidateQueries({ queryKey: ['listing-request-messages', application.id] })
    },
  })

  const { mutate: approveApplication, isPending: isApproving } = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, string>) => Promise<{ error: { message: string } | null }> })
        .rpc('approve_listing_request', { p_request_id: application.id })
      if (error) throw new Error(error.message)
      supabase.functions.invoke('send-listing-status-notification', {
        body: { request_id: application.id, status: 'approved' },
      }).catch(() => {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-owner-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-owner-app-counts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-owner-application', application.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-listing-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-listing-counts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const { mutate: rejectApplication, isPending: isRejecting } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shop_listing_requests')
        .update({ status: 'rejected' } as never)
        .eq('id', application.id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
      supabase.functions.invoke('send-listing-status-notification', {
        body: { request_id: application.id, status: 'rejected' },
      }).catch(() => {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-owner-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-owner-app-counts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-owner-application', application.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-listing-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-listing-counts'] })
    },
  })

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    sendMessage(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const isProcessing = isApproving || isRejecting

  return (
    <div className="flex h-full flex-col">

      {/* ── Application info header */}
      <div className="shrink-0 border-b border-border bg-white px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 transition-colors hover:text-foreground/70 lg:hidden"
        >
          <ArrowLeft className="h-3 w-3" /> 一覧へ戻る
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
            <Store className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-headline text-[14px] font-black tracking-tight text-foreground/80">
                {application.shop_name}
              </h2>
              <span className={cn('rounded-sm px-1.5 py-0.5 font-headline text-[8px] font-black uppercase tracking-wider', conf.badgeClass)}>
                {conf.label}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              {application.applicant_name && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  <User className="h-2.5 w-2.5" />
                  {application.applicant_name}
                  {application.applicant_role && (
                    <span className="ml-1 rounded-sm bg-muted px-1 py-0.5 font-headline text-[8px] font-black text-muted-foreground/60">
                      {application.applicant_role === 'owner' ? 'オーナー' : '店長'}
                    </span>
                  )}
                </span>
              )}
              {application.applicant_phone && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  <Phone className="h-2.5 w-2.5" />{application.applicant_phone}
                </span>
              )}
              {application.instagram_handle && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  <span className="font-headline text-[8px] font-black">IG</span>
                  @{application.instagram_handle}
                </span>
              )}
              {application.address && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  <MapPin className="h-2.5 w-2.5" />{application.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin action bar */}
      {isPending && (
        <div className="shrink-0 border-b border-amber-200/70 bg-amber-50/60 px-5 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-amber-700/50">
              審査アクション
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => rejectApplication()}
                disabled={isProcessing}
                className="flex h-7 items-center gap-1.5 border border-red-200 bg-white px-3 font-headline text-[9px] font-black uppercase tracking-wider text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
              >
                <X className="h-3 w-3" /> 却下
              </button>
              <button
                onClick={() => approveApplication()}
                disabled={isProcessing}
                className="flex h-7 items-center gap-1.5 bg-emerald-500 px-3 font-headline text-[9px] font-black uppercase tracking-wider text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
              >
                {isProcessing
                  ? <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                  : <Check className="h-3 w-3" />
                }
                承認・オーナー昇格
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-background px-5 py-5">
        {msgsLoading && (
          <div className="flex justify-center py-10">
            <div className="h-4 w-4 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          </div>
        )}
        {!msgsLoading && (!messages || messages.length === 0) && (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <MessageCircle className="h-7 w-7 text-muted-foreground/12" />
            <p className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
              No Messages
            </p>
            <p className="text-[11px] text-muted-foreground/40">申請者にメッセージを送ってください</p>
          </div>
        )}
        {!msgsLoading && messages && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isSelf = msg.sender_id === user?.id
              const senderIsAdmin = msg.users?.role === 'admin'
              const name = senderIsAdmin ? 'フクナビ運営' : (msg.users?.display_name ?? 'ユーザー')
              return (
                <div key={msg.id} className={cn('flex flex-col gap-1', isSelf ? 'items-end' : 'items-start')}>
                  <div className="flex items-center gap-1.5">
                    {senderIsAdmin && !isSelf && (
                      <span className="rounded-sm bg-primary/[0.07] px-1.5 py-0.5 font-headline text-[8px] font-black uppercase tracking-wider text-primary/70">
                        Staff
                      </span>
                    )}
                    <span className="font-headline text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/35">
                      {name}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground/25">
                      {new Date(msg.created_at).toLocaleString('ja-JP', {
                        month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className={cn(
                    'max-w-[85%] px-4 py-2.5',
                    isSelf
                      ? 'bg-primary text-white'
                      : 'border border-border bg-white editorial-shadow',
                  )}>
                    <p className={cn(
                      'whitespace-pre-wrap text-[13px] leading-[1.75]',
                      isSelf ? 'text-white/90' : 'text-foreground/75',
                    )}>
                      {msg.body}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Resolved state footer */}
      {!isPending && (
        <div className={cn(
          'shrink-0 border-t px-5 py-2.5 text-center',
          application.status === 'approved'
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200 bg-red-50',
        )}>
          <p className={cn(
            'font-headline text-[10px] font-black uppercase tracking-[0.3em]',
            application.status === 'approved' ? 'text-emerald-700' : 'text-red-600',
          )}>
            {application.status === 'approved' ? 'この申請は承認されました' : 'この申請は却下されました'}
          </p>
        </div>
      )}

      {/* ── Input area */}
      {application.status === 'pending' && (
        <div className="shrink-0 border-t border-border bg-white px-5 py-3">
          <div className="flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力… (Cmd+Enter で送信)"
              rows={2}
              className="flex-1 resize-none border border-border bg-muted/30 px-3 py-2 text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/30 transition-all focus:border-foreground/25 focus:bg-white focus:outline-none"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary text-white transition-opacity hover:opacity-80 disabled:opacity-30"
            >
              {isSending
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <Send className="h-3.5 w-3.5" />
              }
            </button>
          </div>
          <p className="mt-1 text-right font-mono text-[9px] text-muted-foreground/25">Cmd+Enter で送信</p>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

type TabType = 'listings' | 'owner'

const AdminApplicationsPage = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('listings')
  const [listingStatus, setListingStatus] = useState('pending')
  const [ownerStatus, setOwnerStatus] = useState('pending')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [listingPage, setListingPage] = useState(1)
  const [listingPageSize, setListingPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])
  const [ownerPage, setOwnerPage] = useState(1)
  const [ownerPageSize, setOwnerPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])

  useEffect(() => { setListingPage(1) }, [listingStatus, listingPageSize])
  useEffect(() => { setOwnerPage(1) }, [ownerStatus, ownerPageSize])

  // Listing requests (is_owner_request = false)
  const { data: listingData, isLoading: listingLoading, error: listingError } = useListingRequests(listingStatus, listingPage, listingPageSize)
  const { data: listingCountData } = useListingRequestCounts()

  // Owner applications (is_owner_request = true)
  const { data: ownerData, isLoading: ownerLoading } = useOwnerApplications(ownerStatus, ownerPage, ownerPageSize)
  const { data: ownerCountData } = useOwnerAppCounts()

  // Single app query for DM pane (stable across filter/page changes)
  const { data: selectedOwnerApp } = useOwnerApplication(selectedOwnerId)

  const listingRequests = listingData?.items ?? []
  const listingTotalCount = listingData?.totalCount ?? 0
  const listingTotalPages = Math.max(1, Math.ceil(listingTotalCount / listingPageSize))

  const ownerApplications = ownerData?.items ?? []
  const ownerTotalCount = ownerData?.totalCount ?? 0
  const ownerTotalPages = Math.max(1, Math.ceil(ownerTotalCount / ownerPageSize))

  const listingCounts: Record<string, number> = {
    all:      listingCountData?.all ?? 0,
    pending:  listingCountData?.pending ?? 0,
    approved: listingCountData?.approved ?? 0,
    rejected: listingCountData?.rejected ?? 0,
  }

  const ownerCounts: Record<string, number> = {
    all:      ownerCountData?.all ?? 0,
    pending:  ownerCountData?.pending ?? 0,
    approved: ownerCountData?.approved ?? 0,
    rejected: ownerCountData?.rejected ?? 0,
  }

  const totalPending = (listingCountData?.pending ?? 0) + (ownerCountData?.pending ?? 0)

  const { mutate: updateListingStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      if (status === 'approved') {
        const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, string>) => Promise<{ error: { message: string } | null }> })
          .rpc('approve_listing_request', { p_request_id: requestId })
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('shop_listing_requests')
          .update({ status } as never)
          .eq('id', requestId) as unknown as { data: unknown; error: { message: string } | null }
        if (error) throw new Error(error.message)
      }
      if (status === 'approved' || status === 'rejected') {
        supabase.functions.invoke('send-listing-status-notification', {
          body: { request_id: requestId, status },
        }).catch(() => {})
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listing-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-listing-counts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
    },
  })


  return (
    <div className={cn(
      'flex flex-col',
      activeTab === 'owner'
        ? 'h-[calc(100dvh-56px)]'
        : 'min-h-[calc(100dvh-56px)]',
    )}>

      {/* ── Page header + tabs ──────────────────── */}
      <section className="relative shrink-0 overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            APPLY
          </span>
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="pb-0">
            <Link
              to="/admin"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" /> ダッシュボード
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Admin</p>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                  申請管理
                </h1>
              </div>
              {totalPending > 0 && (
                <div className="flex items-center gap-2 rounded-sm border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  <span className="font-headline text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {totalPending} 件審査待ち
                  </span>
                </div>
              )}
            </div>

            {/* Tab bar */}
            <div className="mt-6 flex">
              {(
                [
                  { key: 'listings' as const, label: '掲載申請', count: listingCounts.pending },
                  { key: 'owner'    as const, label: 'オーナー申請', count: ownerCounts.pending },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-5 py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] transition-colors',
                    activeTab === tab.key
                      ? 'border-white text-white'
                      : 'border-transparent text-white/30 hover:text-white/60',
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="rounded-sm bg-amber-400/20 px-1.5 py-0.5 font-headline text-[9px] font-black text-amber-300">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LISTINGS TAB ─────────────────────────────── */}
      {activeTab === 'listings' && (
        <div className="flex-1 bg-background">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-16 md:py-10">

            <div className="mb-6">
              <FilterBar value={listingStatus} counts={listingCounts} onChange={setListingStatus} />
            </div>

            {listingError && (
              <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-medium text-red-700">{(listingError as Error).message}</p>
              </div>
            )}
            {listingLoading && (
              <div className="flex justify-center py-16">
                <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
              </div>
            )}
            {!listingLoading && !listingError && listingRequests.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <p className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                  該当する申請がありません
                </p>
              </div>
            )}
            {!listingLoading && listingRequests.length > 0 && (
              <div className="space-y-2">
                {listingRequests.map((req, i) => (
                  <ListingRow
                    key={req.id}
                    req={req}
                    index={(listingPage - 1) * listingPageSize + i}
                    onApprove={(id) => updateListingStatus({ requestId: id, status: 'approved' })}
                    onReject={(id) => updateListingStatus({ requestId: id, status: 'rejected' })}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
            )}
            {!listingLoading && (
              <AdminPagination
                page={listingPage}
                totalPages={listingTotalPages}
                totalItems={listingTotalCount}
                pageSize={listingPageSize}
                onPageChange={setListingPage}
                onPageSizeChange={(size) => { setListingPageSize(size); setListingPage(1) }}
              />
            )}
          </div>
        </div>
      )}

      {/* ── OWNER TAB (split pane) ────────────────────── */}
      {activeTab === 'owner' && (
        <div className="min-h-0 flex-1 overflow-hidden bg-background">
          <div className="flex h-full">

            {/* Left: application list */}
            <div className={cn(
              'flex flex-col border-r border-border bg-white',
              'w-full shrink-0 lg:w-[320px] xl:w-[360px]',
              selectedOwnerId ? 'hidden lg:flex' : 'flex',
            )}>
              {/* Filter */}
              <div className="shrink-0 border-b border-border px-4 py-3">
                <FilterBar value={ownerStatus} counts={ownerCounts} onChange={setOwnerStatus} compact />
              </div>

              {/* List */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {ownerLoading && (
                  <div className="flex justify-center py-10">
                    <div className="h-4 w-4 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
                  </div>
                )}
                {!ownerLoading && ownerApplications.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-16 text-center">
                    <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                      該当する申請がありません
                    </span>
                  </div>
                )}
                <div className="divide-y divide-border/60">
                  {ownerApplications.map((app, i) => (
                    <OwnerAppItem
                      key={app.id}
                      app={app}
                      index={(ownerPage - 1) * ownerPageSize + i}
                      isSelected={selectedOwnerId === app.id}
                      onSelect={() => setSelectedOwnerId(app.id)}
                    />
                  ))}
                </div>
                {ownerApplications.length > 0 && (
                  <div className="shrink-0 border-t border-border bg-background px-4 py-3">
                    <AdminPagination
                      page={ownerPage}
                      totalPages={ownerTotalPages}
                      totalItems={ownerTotalCount}
                      pageSize={ownerPageSize}
                      onPageChange={setOwnerPage}
                      onPageSizeChange={(size) => { setOwnerPageSize(size); setOwnerPage(1) }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right: DM pane */}
            <div className={cn(
              'min-h-0 flex-1 overflow-hidden',
              selectedOwnerId ? 'flex flex-col' : 'hidden lg:flex lg:flex-col',
            )}>
              {selectedOwnerApp != null ? (
                <OwnerDmPane
                  key={selectedOwnerApp.id}
                  application={selectedOwnerApp}
                  onClose={() => setSelectedOwnerId(null)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/10" />
                  <div>
                    <p className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">
                      申請を選択
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/30">
                      左の一覧から申請を選ぶと詳細・チャットが表示されます
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default AdminApplicationsPage
