import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Send, Check, X, Store, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────

interface ApplicationDetail {
  id: string
  shop_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  submitted_by: string
  users: { display_name: string | null } | null
}

interface DmMessage {
  id: string
  request_id: string
  sender_id: string
  body: string
  created_at: string
  users: { display_name: string | null; role: string } | null
}

// ── Data hooks ─────────────────────────────────────────────────

const useApplication = (requestId: string) =>
  useQuery({
    queryKey: ['owner-application', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_listing_requests')
        .select('id, shop_name, status, created_at, submitted_by, users:submitted_by ( display_name )')
        .eq('id', requestId)
        .single() as unknown as {
          data: ApplicationDetail | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return data
    },
  })

const useDmMessages = (requestId: string) =>
  useQuery({
    queryKey: ['listing-request-messages', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_request_messages')
        .select('id, request_id, sender_id, body, created_at, users:sender_id ( display_name, role )')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true }) as unknown as {
          data: DmMessage[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return data ?? []
    },
    refetchInterval: 10_000, // 10秒ポーリング
  })

// ── Status config ──────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: '審査中',  badgeClass: 'bg-amber-50 text-amber-700' },
  approved: { label: '承認済',  badgeClass: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '却下',    badgeClass: 'bg-red-50 text-red-600' },
} as const

// ── Sub-components ─────────────────────────────────────────────

interface MessageBubbleProps {
  message: DmMessage
  isSelf: boolean
}

const MessageBubble = ({ message, isSelf }: MessageBubbleProps) => {
  const senderIsAdmin = message.users?.role === 'admin'
  const name = senderIsAdmin ? 'フクナビ運営' : (message.users?.display_name ?? 'ユーザー')

  return (
    <div className={cn('flex flex-col gap-1', isSelf ? 'items-end' : 'items-start')}>
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
          {new Date(message.created_at).toLocaleString('ja-JP', {
            month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>

      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5',
          isSelf
            ? 'bg-primary text-white'
            : 'border border-border bg-white text-foreground editorial-shadow',
        )}
      >
        <p className={cn(
          'whitespace-pre-wrap text-[13px] leading-[1.75]',
          isSelf ? 'text-white/90' : 'text-foreground/75',
        )}>
          {message.body}
        </p>
      </div>
    </div>
  )
}

// ── Admin action bar ───────────────────────────────────────────

interface AdminActionBarProps {
  requestId: string
  status: ApplicationDetail['status']
  onApprove: () => void
  onReject: () => void
  isProcessing: boolean
}

const AdminActionBar = ({ status, onApprove, onReject, isProcessing }: AdminActionBarProps) => {
  if (status !== 'pending') return null

  return (
    <div className="border-b border-border bg-amber-50/60 px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-amber-700/60">
          審査アクション
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            disabled={isProcessing}
            className="flex h-8 items-center gap-1.5 border border-red-200 bg-white px-3 font-headline text-[9px] font-black uppercase tracking-wider text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
          >
            <X className="h-3 w-3" />
            却下
          </button>
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="flex h-8 items-center gap-1.5 bg-emerald-500 px-4 font-headline text-[9px] font-black uppercase tracking-wider text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
          >
            {isProcessing ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            承認してオーナーに昇格
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const OwnerApplicationDMPage = () => {
  const { requestId } = useParams<{ requestId: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [inputValue, setInputValue] = useState('')
  const isAdmin = user?.role === 'admin'

  const { data: application, isLoading: appLoading } = useApplication(requestId ?? '')
  const { data: messages, isLoading: msgsLoading } = useDmMessages(requestId ?? '')

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (body: string) => {
      if (!user || !requestId) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('listing_request_messages')
        .insert({ request_id: requestId, sender_id: user.id, body } as never) as unknown as {
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      setInputValue('')
      queryClient.invalidateQueries({ queryKey: ['listing-request-messages', requestId] })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    },
  })

  const { mutate: approveApplication, isPending: isApproving } = useMutation({
    mutationFn: async () => {
      if (!requestId) throw new Error('Request ID is required')
      const { error } = await (supabase as any).rpc('approve_owner_application', {
        p_request_id: requestId,
      }) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-application', requestId] })
      queryClient.invalidateQueries({ queryKey: ['admin-listing-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const { mutate: rejectApplication, isPending: isRejecting } = useMutation({
    mutationFn: async () => {
      if (!requestId) throw new Error('Request ID is required')
      const { error } = await supabase
        .from('shop_listing_requests')
        .update({ status: 'rejected' } as never)
        .eq('id', requestId) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-application', requestId] })
      queryClient.invalidateQueries({ queryKey: ['admin-listing-requests'] })
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

  const backPath = isAdmin ? '/admin/applications' : '/mypage'
  const statusConf = application ? STATUS_CONFIG[application.status] : null
  const isProcessing = isApproving || isRejecting

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">

      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-8 md:px-10">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            DM
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-5">
            <Link
              to={backPath}
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              {isAdmin ? 'Applications' : 'マイページ'}
            </Link>

            {appLoading ? (
              <div className="h-8 w-48 animate-pulse rounded-sm bg-white/10" />
            ) : application ? (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Store className="h-3.5 w-3.5 text-white/40" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
                    オーナー申請 DM
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <h1 className="font-headline text-2xl font-black leading-none tracking-tight text-white md:text-3xl">
                    {application.shop_name}
                  </h1>
                  {statusConf && (
                    <span className={cn(
                      'mb-0.5 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider',
                      statusConf.badgeClass,
                    )}>
                      {statusConf.label}
                    </span>
                  )}
                </div>
                {!isAdmin && (
                  <p className="mt-2 text-[10px] text-white/30">
                    フクナビ運営とのやり取りで本人確認を行います
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Admin action bar ──────────────────────── */}
      {isAdmin && application && (
        <AdminActionBar
          requestId={requestId ?? ''}
          status={application.status}
          onApprove={approveApplication}
          onReject={rejectApplication}
          isProcessing={isProcessing}
        />
      )}

      {/* ── Messages area ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-10">

          {msgsLoading && (
            <div className="flex justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
          )}

          {!msgsLoading && messages?.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/15" />
              <div>
                <p className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                  No Messages
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/40">
                  {isAdmin
                    ? '申請者にメッセージを送ってください'
                    : 'フクナビ運営からのメッセージをお待ちください'}
                </p>
              </div>
            </div>
          )}

          {!msgsLoading && messages && messages.length > 0 && (
            <div className="space-y-5">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSelf={msg.sender_id === user?.id}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Input area ────────────────────────────── */}
      {application?.status === 'pending' && (
        <div className="border-t border-border bg-white px-4 py-3 md:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力… (Cmd+Enter で送信)"
                rows={2}
                className="flex-1 resize-none border border-border bg-muted/30 px-3 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:border-foreground/25 focus:bg-white focus:outline-none transition-all"
                disabled={isSending}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-white transition-opacity hover:opacity-80 disabled:opacity-30"
              >
                {isSending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-right font-mono text-[9px] text-muted-foreground/25">
              Cmd+Enter で送信
            </p>
          </div>
        </div>
      )}

      {/* ── Resolved state footer ──────────────────── */}
      {application?.status !== 'pending' && (
        <div className={cn(
          'border-t px-4 py-3 text-center',
          application?.status === 'approved'
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200 bg-red-50',
        )}>
          <p className={cn(
            'font-headline text-[10px] font-black uppercase tracking-[0.3em]',
            application?.status === 'approved' ? 'text-emerald-700' : 'text-red-600',
          )}>
            {application?.status === 'approved'
              ? 'この申請は承認されました — オーナーダッシュボードをご確認ください'
              : 'この申請は却下されました'}
          </p>
          {application?.status === 'approved' && !isAdmin && (
            <Link
              to="/owner"
              className="mt-2 inline-flex items-center gap-1.5 font-headline text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700"
            >
              オーナーダッシュボードへ →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default OwnerApplicationDMPage
