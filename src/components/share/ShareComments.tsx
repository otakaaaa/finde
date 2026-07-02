import { useState } from 'react'
import { Link } from 'react-router'
import { Flag, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useShareComments, useAddComment, useDeleteComment } from '@/hooks/useShareComments'
import { useReportShare } from '@/hooks/useShareReports'
import { ShareUserAvatar } from '@/components/share/ShareUserAvatar'
import { cn } from '@/lib/utils'
import type { ShareComment } from '@/types'

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

const MAX = 300

const CommentItem = ({ comment }: { comment: ShareComment }) => {
  const { user } = useAuth()
  const { addToast } = useUiStore()
  const del = useDeleteComment(comment.postId)
  const report = useReportShare()

  const isOwn = user?.id === comment.userId
  const canReport = !!user && !isOwn

  const handleReport = () => {
    report.mutate(
      { commentId: comment.id },
      { onSuccess: () => addToast({ title: '通報を受け付けました', variant: 'default' }) },
    )
  }

  return (
    <div className="flex gap-2.5 py-3">
      <ShareUserAvatar displayName={comment.user.displayName} avatarUrl={comment.user.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="font-headline text-[11px] font-black tracking-tight text-foreground/80">
            {comment.user.displayName ?? '匿名ユーザー'}
          </span>
          <span className="text-[9px] tabular-nums text-muted-foreground/40">{formatDate(comment.createdAt)}</span>
          <div className="ml-auto flex items-center gap-1.5">
            {isOwn && (
              <button
                onClick={() => del.mutate(comment.id)}
                disabled={del.isPending}
                className="text-muted-foreground/30 transition-colors hover:text-red-500 disabled:opacity-50"
                aria-label="コメントを削除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {canReport && (
              <button
                onClick={handleReport}
                disabled={report.isPending}
                className="text-muted-foreground/20 transition-colors hover:text-muted-foreground/60 disabled:opacity-50"
                aria-label="コメントを通報"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="whitespace-pre-wrap text-[12px] leading-[1.7] text-foreground/70">{comment.body}</p>
      </div>
    </div>
  )
}

export const ShareComments = ({ postId }: { postId: string }) => {
  const { user } = useAuth()
  const { data: comments, isLoading } = useShareComments(postId)
  const add = useAddComment(postId)
  const [body, setBody] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    add.mutate(trimmed, { onSuccess: () => setBody('') })
  }

  return (
    <div>
      <p className="mb-2 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
        コメント {comments ? `(${comments.length})` : ''}
      </p>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            rows={2}
            value={body}
            maxLength={MAX}
            onChange={(e) => setBody(e.target.value)}
            placeholder="コメントを書く…"
            className="w-full resize-none rounded-sm border border-border bg-white px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[9px] tabular-nums text-muted-foreground/40">{body.length}/{MAX}</span>
            <button
              type="submit"
              disabled={add.isPending || !body.trim()}
              className={cn(
                'bg-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-opacity',
                'hover:opacity-90 disabled:opacity-40',
              )}
            >
              送信
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-4 text-[11px] text-muted-foreground">
          <Link to="/auth/login" className="font-bold text-primary underline-offset-2 hover:underline">
            ログイン
          </Link>
          するとコメントできます。
        </p>
      )}

      {isLoading ? (
        <p className="py-4 text-center text-[11px] text-muted-foreground/40">読み込み中…</p>
      ) : comments && comments.length > 0 ? (
        <div className="divide-y divide-border">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-[11px] text-muted-foreground/40">まだコメントはありません。</p>
      )}
    </div>
  )
}
