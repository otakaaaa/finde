import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronDown, Mail, Flag, Send } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useMyContacts, useContactReplies } from '@/hooks/useContacts'
import { CATEGORY_LABEL, STATUS_CONFIG } from '@/constants/contact'
import type { Contact, ContactReply } from '@/constants/contact'
import { formatTimeAgo } from '@/lib/timeago'
import { cn } from '@/lib/utils'

// ── Reply list ─────────────────────────────────────────────────

const AdminReplyBubble = ({ reply }: { reply: ContactReply }) => (
  /* 運営: 左寄せ・primary アクセントバー・公式スタンプ感 */
  <div className="flex gap-3">
    {/* 左レール */}
    <div className="flex flex-col items-center">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary">
        <Mail className="h-3 w-3 text-white" />
      </div>
      <div className="mt-1 w-px flex-1 bg-sky-200" />
    </div>

    <div className="mb-3 min-w-0 flex-1">
      {/* ヘッダー */}
      <div className="mb-2 flex items-center gap-2">
        <span className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-primary/70">
          フクナビ運営
        </span>
        <span className="rounded-sm bg-primary/8 px-1.5 py-0.5 font-headline text-[7px] font-black uppercase tracking-wider text-primary/50">
          STAFF
        </span>
        <span className="ml-auto font-headline text-[9px] tabular-nums text-muted-foreground/30">
          {formatTimeAgo(reply.created_at)}
        </span>
      </div>
      {/* 本文 */}
      <div className="border border-sky-200 bg-sky-50 px-4 py-3">
        <p className="whitespace-pre-wrap text-[12px] leading-[1.9] text-foreground/75">
          {reply.body}
        </p>
      </div>
    </div>
  </div>
)

const UserReplyBubble = ({ reply }: { reply: ContactReply }) => (
  /* 自分: 右寄せ・左マージン・淡いグレー */
  <div className="flex gap-3">
    <div className="min-w-0 flex-1 pl-8">
      {/* ヘッダー（右寄せ） */}
      <div className="mb-2 flex items-center justify-end gap-2">
        <span className="font-headline text-[9px] tabular-nums text-muted-foreground/30">
          {formatTimeAgo(reply.created_at)}
        </span>
        <span className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
          あなた
        </span>
      </div>
      {/* 本文 */}
      <div className="border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="whitespace-pre-wrap text-[12px] leading-[1.9] text-foreground/65">
          {reply.body}
        </p>
      </div>
    </div>

    {/* 右レール */}
    <div className="flex flex-col items-center">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-amber-200 bg-amber-50">
        <span className="font-headline text-[8px] font-black text-amber-500">ME</span>
      </div>
      <div className="mt-1 w-px flex-1 bg-amber-200" />
    </div>
  </div>
)

const ReplyList = ({ contactId }: { contactId: string }) => {
  const { data: replies, isLoading } = useContactReplies(contactId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-[10px] text-muted-foreground/40">読み込み中...</span>
      </div>
    )
  }

  if (!replies || replies.length === 0) return null

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <span className="mb-3 block font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
        やりとり
      </span>
      <div className="space-y-1">
        {replies.map((reply: ContactReply) =>
          reply.is_admin_reply
            ? <AdminReplyBubble key={reply.id} reply={reply} />
            : <UserReplyBubble key={reply.id} reply={reply} />
        )}
      </div>
    </div>
  )
}

// ── User reply form ────────────────────────────────────────────

const UserReplyForm = ({ contactId }: { contactId: string }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

  const { mutate: sendReply, isPending } = useMutation({
    mutationFn: async (replyBody: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('contact_replies')
        .insert({ contact_id: contactId, body: replyBody, replied_by: user.id, is_admin_reply: false } as never) as unknown as {
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      setBody('')
      queryClient.invalidateQueries({ queryKey: ['contact-replies', contactId] })
    },
  })

  return (
    <div className="mt-4 space-y-2">
      <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/25">
        追記・返信
      </span>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="追加の情報や返信内容を入力..."
        className={cn(
          'w-full resize-none rounded-sm border border-border bg-white px-3 py-2 text-[12px] leading-relaxed',
          'placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50',
        )}
      />
      <button
        onClick={() => { const t = body.trim(); if (t) sendReply(t) }}
        disabled={isPending || !body.trim()}
        className="flex h-8 items-center gap-1.5 bg-primary px-3 font-headline text-[9px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending
          ? <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />送信中...</>
          : <><Send className="h-3 w-3" />送信</>
        }
      </button>
    </div>
  )
}

// ── Contact card ───────────────────────────────────────────────

interface ContactCardProps {
  contact: Contact
  expanded: boolean
  onToggle: () => void
  index: number
}

const ContactCard = ({ contact, expanded, onToggle, index }: ContactCardProps) => {
  const conf = STATUS_CONFIG[contact.status]

  return (
    <div
      className={cn(
        'wish-card-enter border-l-[3px] bg-white editorial-shadow',
        conf.borderClass,
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
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
          <p className="mt-0.5 text-[10px] text-muted-foreground/40">
            {CATEGORY_LABEL[contact.category]}
          </p>
        </div>

        <ChevronDown className={cn(
          'mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/25 transition-transform duration-200',
          expanded && 'rotate-180',
        )} />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-4 pb-5 pt-3">
          <div className="mb-4">
            <span className="mb-1 block font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
              お問い合わせ内容
            </span>
            <p className="whitespace-pre-wrap text-[12px] leading-[1.9] text-foreground/70">
              {contact.body}
            </p>
          </div>
          <ReplyList contactId={contact.id} />
          {!contact.is_noreply && <UserReplyForm contactId={contact.id} />}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const ContactsPage = () => {
  const { data: contacts, isLoading, error } = useMyContacts()
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
        <div className="relative mx-auto max-w-5xl pb-6">
          <Link
            to="/mypage"
            className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
          >
            <ChevronLeft className="h-3 w-3" />
            マイページ
          </Link>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Mypage</p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
            お問い合わせ履歴
          </h1>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && (!contacts || contacts.length === 0) && (
            <div className="flex flex-col items-center gap-2 py-24 text-center">
              <Mail className="mb-2 h-8 w-8 text-muted-foreground/15" />
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                No Contacts
              </span>
              <p className="text-xs text-muted-foreground/40">お問い合わせ履歴はありません</p>
              <Link
                to="/contact"
                className="mt-4 bg-primary px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90"
              >
                お問い合わせする
              </Link>
            </div>
          )}

          {/* List */}
          {!isLoading && contacts && contacts.length > 0 && (
            <div className="space-y-1.5">
              {contacts.map((contact, i) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  expanded={expandedId === contact.id}
                  onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                  index={i}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ContactsPage
