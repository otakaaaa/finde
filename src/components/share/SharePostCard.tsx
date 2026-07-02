import { useState } from 'react'
import { Link } from 'react-router'
import { MessageCircle, Eye, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getSharePhotoUrl } from '@/components/share/sharePhoto'
import { SharePhotoGallery } from '@/components/share/SharePhotoGallery'
import { ShareScore } from '@/components/share/ShareScore'
import { ShareShopChips } from '@/components/share/ShareShopChips'
import { ShareBookmarkButton } from '@/components/share/ShareBookmarkButton'
import { ShareRatingPopover } from '@/components/share/ShareRatingPopover'
import { ShareCommentSheet } from '@/components/share/ShareCommentSheet'
import { ImpressionTracker } from '@/components/share/ImpressionTracker'
import { ShareUserAvatar } from '@/components/share/ShareUserAvatar'
import type { SharePost } from '@/types'

const formatDate = (dateStr: string | null) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : ''

interface SharePostCardProps {
  post: SharePost
  /** マイページ管理など、本人向け表示（非公開バッジを出す） */
  showVisibility?: boolean
}

export const SharePostCard = ({ post, showVisibility = false }: SharePostCardProps) => {
  const { user } = useAuth()
  const [ratingOpen, setRatingOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)

  const isOwn = user?.id === post.userId
  const photoUrls = post.photos.map((p) => getSharePhotoUrl(p.storagePath, { width: 800, height: 800 }))

  return (
    <ImpressionTracker postId={post.id}>
      <article className="wish-card-enter group relative border-l-[3px] border-l-border bg-white editorial-shadow transition-colors hover:border-l-primary">
        <Link to={`/share/${post.id}`} className="block px-4 pb-3 pt-4 sm:px-5">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShareUserAvatar displayName={post.user.displayName} avatarUrl={post.user.avatarUrl} size="md" />
              <div>
                <p className="font-headline text-[12px] font-black tracking-tight text-foreground/80">
                  {post.user.displayName ?? '匿名ユーザー'}
                </p>
                <p className="text-[9px] tabular-nums text-muted-foreground/40">{formatDate(post.publishedAt ?? post.createdAt)}</p>
              </div>
            </div>
            {showVisibility && post.visibility === 'private' && (
              <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground/60">
                <Lock className="h-2.5 w-2.5" /> 非公開
              </span>
            )}
          </div>

          {/* Body */}
          <p className="line-clamp-4 whitespace-pre-wrap text-[13px] leading-[1.8] text-foreground/75">
            {post.body}
          </p>
        </Link>

        {/* Photos — Link の外に出して stopPropagation でナビゲーションをブロック */}
        {photoUrls.length > 0 && (
          <div
            className="px-4 sm:px-5"
            onClick={(e) => e.stopPropagation()}
          >
            <SharePhotoGallery urls={photoUrls} className="mt-3 overflow-hidden rounded-sm border border-border" />
          </div>
        )}

        {/* Shops — <a> の入れ子を避けるためカードリンクの外に配置 */}
        {post.shops.length > 0 && (
          <div className="px-4 py-3 sm:px-5">
            <ShareShopChips shops={post.shops} />
          </div>
        )}

        {/* Metrics footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 sm:px-5">
          {/* シャレ度 — 自分の投稿以外はポップオーバートリガー */}
          {isOwn ? (
            <ShareScore averageScore={post.averageScore} ratingCount={post.ratingCount} />
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRatingOpen((v) => !v)}
                className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                aria-label="シャレ度を送る"
                aria-expanded={ratingOpen}
              >
                <ShareScore averageScore={post.averageScore} ratingCount={post.ratingCount} />
              </button>
              {ratingOpen && (
                <ShareRatingPopover post={post} onClose={() => setRatingOpen(false)} />
              )}
            </div>
          )}

          {/* コメント — ボトムシートトリガー */}
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="inline-flex items-center gap-1 text-[10px] font-black tabular-nums text-muted-foreground/50 transition-colors hover:text-foreground"
            aria-label="コメントを見る"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount}
          </button>

          <ShareBookmarkButton post={post} />

          <span className="ml-auto inline-flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground/40">
            <Eye className="h-3.5 w-3.5" />
            {post.impressionCount}
          </span>
        </div>
      </article>

      <ShareCommentSheet
        postId={post.id}
        commentCount={post.commentCount}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </ImpressionTracker>
  )
}
