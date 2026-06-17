import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowRight, Pencil, MessageCircle, Eye, Lock, X, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSharePost } from '@/hooks/useSharePosts'
import { useRateShare } from '@/hooks/useShareRatings'
import { SharePhotoGallery } from '@/components/share/SharePhotoGallery'
import { ShareShopChips } from '@/components/share/ShareShopChips'
import { ShareScore } from '@/components/share/ShareScore'
import { ShareBookmarkButton } from '@/components/share/ShareBookmarkButton'
import { ShareToXButton } from '@/components/share/ShareToXButton'
import { ShareComments } from '@/components/share/ShareComments'
import { getSharePhotoUrl } from '@/components/share/sharePhoto'
import { cn } from '@/lib/utils'
import { Seo } from '@/components/seo/Seo'
import type { SharePost } from '@/types'

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

const formatDate = (dateStr: string | null) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : ''

// ── シャレ度ポップオーバー ──────────────────────────────────────

interface RatingPopoverProps {
  post: SharePost
  onClose: () => void
}

const RatingPopover = ({ post, onClose }: RatingPopoverProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { mutate, isPending } = useRateShare(post.id)

  const handleRate = (score: number) => {
    mutate(score, { onSuccess: onClose })
  }

  return (
    <>
      {/* 外クリックで閉じる透明バックドロップ */}
      <div className="fixed inset-0 z-20" onClick={onClose} />

      {/* ポップオーバー本体 */}
      <div className="absolute bottom-full left-0 z-30 mb-2 w-max rounded-sm border border-border bg-white p-3 editorial-shadow">
        {/* ラベル */}
        <p className="mb-2.5 flex items-center gap-1.5 font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
          <Sparkles className="h-3 w-3 text-primary/60" />
          シャレ度を送る
          {post.myScore !== null && (
            <span className="text-primary">— 現在: {post.myScore}</span>
          )}
        </p>

        {user ? (
          /* 2×5 グリッド */
          <div className="grid grid-cols-5 gap-1">
            {SCORES.map((score) => (
              <button
                key={score}
                type="button"
                disabled={isPending}
                onClick={() => handleRate(score)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center border font-headline text-[12px] font-black tabular-nums transition-all disabled:opacity-40',
                  post.myScore === score
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-foreground/60 hover:border-primary/50 hover:text-primary',
                )}
                aria-label={`シャレ度 ${score}`}
                aria-pressed={post.myScore === score}
              >
                {score}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/70">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              ログイン
            </button>
            してシャレ度を送れます
          </p>
        )}
      </div>
    </>
  )
}

// ── メインページ ────────────────────────────────────────────────

const SharePostDetailPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: post, isLoading } = useSharePost(id)

  const [ratingOpen, setRatingOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-muted-foreground/40">読み込み中…</p>
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="mb-4 text-sm text-muted-foreground">投稿が見つかりませんでした。</p>
        <Link to="/share" className="text-xs font-bold text-primary underline-offset-2 hover:underline">
          シャレ活タイムラインへ戻る
        </Link>
      </div>
    )
  }

  const isOwn = user?.id === post.userId
  const photoUrls = post.photos.map((p) =>
    getSharePhotoUrl(p.storagePath, { width: 1200, height: 1200 }),
  )

  return (
    <div className="bg-background">
      <Seo title="シャレ活" description={post.body.slice(0, 100)} path={`/share/${post.id}`} />

      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 transition-colors hover:text-foreground"
        >
          ← Back
        </button>

        {/* ── 投稿カード ── */}
        <div className="border-l-[3px] border-l-border bg-white px-5 py-6 editorial-shadow">
          {/* 投稿者 */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted font-headline text-[13px] font-black text-muted-foreground/60">
              {post.user.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-headline text-[13px] font-black tracking-tight text-foreground/90">
                {post.user.displayName ?? '匿名ユーザー'}
              </p>
              <p className="flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground/40">
                {formatDate(post.publishedAt ?? post.createdAt)}
                {post.visibility === 'private' && (
                  <span className="inline-flex items-center gap-0.5 text-muted-foreground/50">
                    <Lock className="h-2.5 w-2.5" /> 非公開
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 本文 */}
          <p className="whitespace-pre-wrap text-[14px] leading-[1.9] text-foreground/80">
            {post.body}
          </p>

          {/* 写真 */}
          {photoUrls.length > 0 && (
            <div className="-mx-5 mt-4">
              <SharePhotoGallery urls={photoUrls} />
            </div>
          )}

          {/* 関連店舗 */}
          {post.shops.length > 0 && (
            <div className="mt-4">
              <ShareShopChips shops={post.shops} />
            </div>
          )}

          {/* ── メトリクス行 ── */}
          <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">

            {/* シャレ度 — 自分の投稿以外はポップオーバートリガー */}
            {isOwn ? (
              <ShareScore averageScore={post.averageScore} ratingCount={post.ratingCount} size="lg" />
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRatingOpen((v) => !v)}
                  className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                  aria-label="シャレ度を送る"
                  aria-expanded={ratingOpen}
                >
                  <ShareScore averageScore={post.averageScore} ratingCount={post.ratingCount} size="lg" />
                </button>
                {ratingOpen && (
                  <RatingPopover post={post} onClose={() => setRatingOpen(false)} />
                )}
              </div>
            )}

            {/* コメント — ボトムシートトリガー */}
            <button
              type="button"
              onClick={() => setCommentsOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-black tabular-nums text-muted-foreground/50 transition-colors hover:text-foreground"
              aria-label="コメントを見る"
            >
              <MessageCircle className="h-4 w-4" />
              {post.commentCount}
            </button>

            {/* ブックマーク */}
            <ShareBookmarkButton post={post} />

            {/* 閲覧数 */}
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground/40">
              <Eye className="h-4 w-4" />
              {post.impressionCount}
            </span>
          </div>
        </div>

        {/* ── アクション行 (X シェア・編集) ── */}
        <div className="mt-4 flex items-center gap-4 px-1">
          <ShareToXButton post={post} />
          {isOwn && (
            <Link
              to={`/share/${post.id}/edit`}
              className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              編集
            </Link>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/share"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 transition-colors hover:text-foreground"
          >
            タイムラインへ
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ── コメント ボトムシート ── */}
      {/* バックドロップ */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          commentsOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setCommentsOpen(false)}
      />

      {/* ドロワー */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white transition-transform duration-300 ease-out',
          commentsOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* ドラッグハンドル */}
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        {/* ヘッダー */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-3 pt-1">
          <span className="font-headline text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
            コメント{post.commentCount > 0 ? ` (${post.commentCount})` : ''}
          </span>
          <button
            type="button"
            onClick={() => setCommentsOpen(false)}
            aria-label="閉じる"
            className="text-muted-foreground/40 transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* スクロール可能なコンテンツ */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-4">
          <ShareComments postId={post.id} />
        </div>
      </div>
    </div>
  )
}

export default SharePostDetailPage
