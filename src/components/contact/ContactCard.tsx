import { useState } from 'react'
import { ChevronDown, Flag, Mail, Send } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useContactReplies } from '@/hooks/useContacts'
import { CATEGORY_LABEL, STATUS_CONFIG } from '@/constants/contact'
import type { Contact, ContactStatus, ContactReply } from '@/constants/contact'
import { formatTimeAgo } from '@/lib/timeago'
import { cn } from '@/lib/utils'

// ── Reply bubbles ──────────────────────────────────────────────

const AdminReplyBubble = ({ reply, hideIcon }: { reply: ContactReply; hideIcon: boolean }) => (
  <div className={cn('flex gap-2.5', hideIcon && '-mt-1')}>
    <div className="flex w-5 flex-col items-center">
      {!hideIcon && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-primary">
          <Mail className="h-2.5 w-2.5 text-white" />
        </div>
      )}
      <div className={cn('w-px flex-1 bg-sky-200', !hideIcon && 'mt-1')} />
    </div>
    <div className="mb-2 min-w-0 flex-1">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="font-headline text-[9px] font-black uppercase tracking-[0.2em] text-sky-600/70">
          {reply.users?.display_name ?? 'フクナビ運営'}
        </span>
        <span className="rounded-sm bg-sky-100 px-1 py-0.5 font-headline text-[7px] font-black uppercase tracking-wider text-sky-500">
          STAFF
        </span>
        <span className="ml-auto text-[9px] text-muted-foreground/30">
          {formatTimeAgo(reply.created_at)}
        </span>
      </div>
      <div className="border border-sky-200 bg-sky-50 px-3 py-2.5">
        <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/70">
          {reply.body}
        </p>
      </div>
    </div>
  </div>
)

const UserReplyBubble = ({ reply, isAdmin, hideIcon }: { reply: ContactReply; isAdmin: boolean; hideIcon: boolean }) => (
  <div className={cn('flex gap-2.5', hideIcon && '-mt-1')}>
    <div className="mb-2 min-w-0 flex-1 pl-6">
      <div className="mb-1 flex items-center justify-end gap-1.5">
        <span className="text-[9px] text-muted-foreground/30">
          {formatTimeAgo(reply.created_at)}
        </span>
        <span className="font-headline text-[9px] font-black uppercase tracking-[0.2em] text-amber-600/60">
          {isAdmin ? 'ユーザー' : 'あなた'}
        </span>
      </div>
      <div className="border border-amber-200 bg-amber-50 px-3 py-2.5">
        <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/70">
          {reply.body}
        </p>
      </div>
    </div>
    <div className="flex w-5 flex-col items-center">
      {!hideIcon && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center border border-amber-200 bg-amber-50">
          <span className="font-headline text-[7px] font-black text-amber-500">ME</span>
        </div>
      )}
      <div className={cn('w-px flex-1 bg-amber-200', !hideIcon && 'mt-1')} />
    </div>
  </div>
)

// ── Reply thread ───────────────────────────────────────────────

const ReplyThread = ({ contactId, isAdmin }: { contactId: string; isAdmin: boolean }) => {
  const { data: replies, isLoading } = useContactReplies(contactId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-[10px] text-muted-foreground/40">読み込み中...</span>
      </div>
    )
  }

  if (!replies || replies.length === 0) return null

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <span className="mb-3 block font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
        やりとり ({replies.length})
      </span>
      <div className="space-y-1">
        {replies.map((reply: ContactReply, i: number) => {
          const hideIcon = i > 0 && replies[i - 1].is_admin_reply === reply.is_admin_reply
          return reply.is_admin_reply
            ? <AdminReplyBubble key={reply.id} reply={reply} hideIcon={hideIcon} />
            : <UserReplyBubble key={reply.id} reply={reply} isAdmin={isAdmin} hideIcon={hideIcon} />
        })}
      </div>
    </div>
  )
}

// ── Admin reply form ───────────────────────────────────────────

const AdminReplyForm = ({
  contactId,
  contactEmail,
  contactSubject,
}: {
  contactId: string
  contactEmail: string
  contactSubject: string
}) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

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

  return (
    <div className="mt-4 space-y-2">
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
        onClick={() => { const t = body.trim(); if (t) sendReply(t) }}
        disabled={isPending || !body.trim()}
        className="flex h-8 items-center gap-1.5 bg-primary px-3 font-headline text-[9px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending
          ? <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />送信中...</>
          : <><Send className="h-3 w-3" />返信を保存</>
        }
      </button>
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

// ── ContactCard ────────────────────────────────────────────────

export interface ContactCardProps {
  contact: Contact
  expanded: boolean
  onToggle: () => void
  isAdmin: boolean
  onStatusChange?: (id: string, status: ContactStatus) => void
  isUpdating?: boolean
  index?: number
}

export const ContactCard = ({
  contact,
  expanded,
  onToggle,
  isAdmin,
  onStatusChange,
  isUpdating = false,
  index = 0,
}: ContactCardProps) => {
  const conf = STATUS_CONFIG[contact.status]

  return (
    <div
      className={cn('wish-card-enter border-l-[3px] bg-white editorial-shadow', conf.borderClass)}
      style={{ animationDelay: `${index * 20}ms` }}
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
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {/* 管理者のみ送信者情報を表示 */}
            {isAdmin && (
              <>
                <span className="text-[10px] text-muted-foreground/50">{contact.name}</span>
                <span className="text-[10px] text-muted-foreground/40">{contact.email}</span>
              </>
            )}
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
          <span className="mb-1 block font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
            お問い合わせ内容
          </span>
          <p className="mb-4 whitespace-pre-wrap text-[12px] leading-[1.9] text-foreground/70">
            {contact.body}
          </p>

          {/* 管理者のみステータス変更ボタンを表示 */}
          {isAdmin && onStatusChange && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
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
          )}

          {/* やりとり表示 */}
          <ReplyThread contactId={contact.id} isAdmin={isAdmin} />

          {/* 返信フォーム（返信不要フラグがない場合のみ） */}
          {!contact.is_noreply && (
            isAdmin
              ? <AdminReplyForm contactId={contact.id} contactEmail={contact.email} contactSubject={contact.subject} />
              : <UserReplyForm contactId={contact.id} />
          )}
        </div>
      )}
    </div>
  )
}
