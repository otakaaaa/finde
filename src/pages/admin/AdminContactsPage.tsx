import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Mail, Search, ChevronDown, Flag, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useContactReplies } from '@/hooks/useInquiries'
import { CATEGORY_LABEL, STATUS_CONFIG } from '@/constants/contact'
import type { Contact, ContactStatus, ContactReply } from '@/constants/contact'
import { formatTimeAgo } from '@/lib/timeago'
import { cn } from '@/lib/utils'

// ── Config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',         label: 'すべて' },
  { value: 'open',        label: '未対応' },
  { value: 'in_progress', label: '対応中' },
  { value: 'closed',      label: '完了' },
] as const

// ── Data hook ──────────────────────────────────────────────────

const useInquiries = (status: string) =>
  useQuery({
    queryKey: ['admin-contacts', status],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (status !== 'all') query = query.eq('status', status)

      const { data, error } = await (query as unknown as Promise<{
        data: Contact[] | null
        error: { message: string } | null
      }>)
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

// ── Reply section ───────────────────────────────────────────────

interface ReplySectionProps {
  contactId: string
  contactEmail: string
  contactSubject: string
}

const ReplySection = ({ contactId, contactEmail, contactSubject }: ReplySectionProps) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const { data: replies, isLoading } = useContactReplies(contactId)

  const { mutate: sendReply, isPending } = useMutation({
    mutationFn: async (replyBody: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('contact_replies')
        .insert({ contact_id: contactId, body: replyBody, replied_by: user.id, is_admin_reply: true } as never) as unknown as {
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      setBody('')
      queryClient.invalidateQueries({ queryKey: ['contact-replies', contactId] })
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] })
    },
  })

  const handleSend = () => {
    const trimmed = body.trim()
    if (!trimmed) return
    sendReply(trimmed)
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Existing replies */}
      {isLoading && (
        <div className="flex items-center gap-2 py-1">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="text-[10px] text-muted-foreground/40">返信を読み込み中...</span>
        </div>
      )}

      {replies && replies.length > 0 && (
        <div className="space-y-2">
          <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
            返信済み ({replies.length})
          </span>
          {replies.map((reply: ContactReply) => (
            <div key={reply.id} className="rounded-sm border border-primary/10 bg-primary/[0.02] px-3 py-2.5">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-headline text-[9px] font-black text-primary/50">
                  {reply.users?.display_name ?? '管理者'}
                </span>
                <span className="text-[9px] text-muted-foreground/35">
                  {formatTimeAgo(reply.created_at)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/70">
                {reply.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/25">
            返信を送る
          </span>
          <a
            href={`mailto:${contactEmail}?subject=Re: ${encodeURIComponent(contactSubject)}`}
            className="flex h-6 items-center gap-1 border border-border bg-muted px-2 font-headline text-[9px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:bg-foreground hover:text-white"
          >
            <Mail className="h-2.5 w-2.5" />
            メールで返信
          </a>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="返信内容を入力..."
          className={cn(
            'w-full resize-none rounded-sm border border-border bg-white px-3 py-2 text-[12px] leading-relaxed',
            'placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50',
          )}
        />
        <button
          onClick={handleSend}
          disabled={isPending || !body.trim()}
          className="flex h-8 items-center gap-1.5 bg-primary px-3 font-headline text-[9px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isPending
            ? <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />送信中...</>
            : <><Send className="h-3 w-3" />返信を保存</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Contact card ───────────────────────────────────────────────

interface ContactCardProps {
  contact: Contact
  expanded: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: ContactStatus) => void
  isUpdating: boolean
}

const ContactCard = ({ contact, expanded, onToggle, onStatusChange, isUpdating }: ContactCardProps) => {
  const conf = STATUS_CONFIG[contact.status]

  return (
    <div className={cn('wish-card-enter border-l-[3px] bg-white editorial-shadow', conf.borderClass)}>
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <span className="mt-0.5 shrink-0 font-headline text-[9px] font-black tabular-nums text-muted-foreground/20">
          {new Date(contact.created_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-headline text-[13px] font-black tracking-tight text-foreground/80">
              {contact.subject}
            </p>
            <span className={cn(
              'rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider',
              conf.badgeClass,
            )}>
              {conf.label}
            </span>
            {contact.is_noreply && (
              <span className="flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">
                <Flag className="h-2.5 w-2.5" />
                返信不要
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-[10px] text-muted-foreground/50">{contact.name}</span>
            <span className="text-[10px] text-muted-foreground/40">{contact.email}</span>
            <span className="text-[10px] text-muted-foreground/35">{CATEGORY_LABEL[contact.category]}</span>
          </div>
        </div>

        <ChevronDown className={cn(
          'mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/25 transition-transform duration-200',
          expanded && 'rotate-180',
        )} />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-4 pb-5 pt-3">
          <p className="mb-4 whitespace-pre-wrap text-[12px] leading-[1.9] text-foreground/70">
            {contact.body}
          </p>

          {/* Status actions */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/25">
              ステータス変更
            </span>
            {(['open', 'in_progress', 'closed'] as ContactStatus[])
              .filter((s) => s !== contact.status)
              .map((s) => {
                const c = STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(contact.id, s)}
                    disabled={isUpdating}
                    className={cn(
                      'flex h-7 items-center gap-1 rounded-sm px-2.5 font-headline text-[9px] font-black uppercase tracking-wider transition-colors disabled:opacity-40',
                      c.badgeClass,
                    )}
                  >
                    {c.label}
                  </button>
                )
              })}
          </div>

          {/* Reply section */}
          {!contact.is_noreply && (
            <ReplySection
              contactId={contact.id}
              contactEmail={contact.email}
              contactSubject={contact.subject}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const AdminContactsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: inquiries, isLoading, error } = useInquiries(statusFilter)

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ status } as never)
        .eq('id', id) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contacts'] }),
  })

  const filtered = (inquiries ?? []).filter((i) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      i.subject.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.body.toLowerCase().includes(q)
    )
  })

  const counts = {
    all:         inquiries?.length ?? 0,
    open:        inquiries?.filter((i) => i.status === 'open').length ?? 0,
    in_progress: inquiries?.filter((i) => i.status === 'in_progress').length ?? 0,
    closed:      inquiries?.filter((i) => i.status === 'closed').length ?? 0,
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
            INBOX
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
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Admin</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              お問い合わせ
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Control bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
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

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="件名・名前・メールで絞り込み"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 rounded-sm border border-border bg-white pl-7 pr-3 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {search && (
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">{filtered.length} 件</span>
            )}
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
          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                No Inquiries
              </span>
              <p className="text-xs text-muted-foreground/40">お問い合わせはありません</p>
            </div>
          )}

          {/* List */}
          {!isLoading && filtered.length > 0 && (
            <div className="space-y-1.5">
              {filtered.map((contact, i) => (
                <div key={contact.id} style={{ animationDelay: `${i * 20}ms` }}>
                  <ContactCard
                    contact={contact}
                    expanded={expandedId === contact.id}
                    onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                    onStatusChange={(id, status) => updateStatus({ id, status })}
                    isUpdating={isUpdating}
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminContactsPage
