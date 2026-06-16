import { Link } from 'react-router'
import { MessageCircle, Eye, Lock } from 'lucide-react'
import { getSharePhotoUrl } from '@/components/share/sharePhoto'
import { ShareScore } from '@/components/share/ShareScore'
import { ShareShopChips } from '@/components/share/ShareShopChips'
import { ShareBookmarkButton } from '@/components/share/ShareBookmarkButton'
import { ImpressionTracker } from '@/components/share/ImpressionTracker'
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
  const cover = post.photos[0]

  return (
    <ImpressionTracker postId={post.id}>
      <article className="wish-card-enter group relative border-l-[3px] border-l-border bg-white editorial-shadow transition-colors hover:border-l-primary">
        <Link to={`/share/${post.id}`} className="block px-4 pb-3 pt-4 sm:px-5">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-muted font-headline text-[11px] font-black text-muted-foreground/60">
                {post.user.displayName?.[0]?.toUpperCase() ?? '?'}
              </div>
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

          {/* Cover photo */}
          {cover && (
            <img
              src={getSharePhotoUrl(cover.storagePath, { width: 700, height: 500 })}
              alt=""
              className="mt-3 max-h-80 w-full rounded-sm border border-border object-cover"
              loading="lazy"
            />
          )}
        </Link>

        {/* Shops — <a> の入れ子を避けるためカードリンクの外に配置 */}
        {post.shops.length > 0 && (
          <div className="px-4 pb-3 sm:px-5">
            <ShareShopChips shops={post.shops} />
          </div>
        )}

        {/* Metrics footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 sm:px-5">
          <ShareScore averageScore={post.averageScore} ratingCount={post.ratingCount} />
          <span className="inline-flex items-center gap-1 text-[10px] font-black tabular-nums text-muted-foreground/50">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount}
          </span>
          <ShareBookmarkButton post={post} />
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground/40">
            <Eye className="h-3.5 w-3.5" />
            {post.impressionCount}
          </span>
        </div>
      </article>
    </ImpressionTracker>
  )
}
