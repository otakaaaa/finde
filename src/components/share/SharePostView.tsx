import { MessageCircle, Eye, Bookmark, Lock } from 'lucide-react'
import { SharePhotoCarousel } from '@/components/share/SharePhotoCarousel'
import { ShareShopChips } from '@/components/share/ShareShopChips'
import { ShareScore } from '@/components/share/ShareScore'
import { getSharePhotoUrl } from '@/components/share/sharePhoto'
import type { SharePost } from '@/types'

const formatDate = (dateStr: string | null) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : ''

interface SharePostViewProps {
  post: SharePost
  /** プレビュー時は日時を「公開後に表示」とする等の軽い調整 */
  preview?: boolean
}

/** 投稿本体の表示（詳細ページ・プレビュー共用）。操作系は呼び出し側で付加する。 */
export const SharePostView = ({ post, preview = false }: SharePostViewProps) => (
  <article>
    {/* Author */}
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted font-headline text-[13px] font-black text-muted-foreground/60">
        {post.user.displayName?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div>
        <p className="font-headline text-[13px] font-black tracking-tight text-foreground/90">
          {post.user.displayName ?? '匿名ユーザー'}
        </p>
        <p className="flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground/40">
          {preview ? '公開後に表示されます' : formatDate(post.publishedAt ?? post.createdAt)}
          {post.visibility === 'private' && (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground/50">
              <Lock className="h-2.5 w-2.5" /> 非公開
            </span>
          )}
        </p>
      </div>
    </div>

    {/* Body */}
    <p className="whitespace-pre-wrap text-[14px] leading-[1.9] text-foreground/80">{post.body}</p>

    {/* Photos */}
    {post.photos.length > 0 && (
      <div className="mt-4 -mx-5">
        <SharePhotoCarousel urls={post.photos.map((p) => getSharePhotoUrl(p.storagePath, { width: 1200, height: 1200 }))} />
      </div>
    )}

    {/* Shops */}
    {post.shops.length > 0 && (
      <div className="mt-4">
        <ShareShopChips shops={post.shops} />
      </div>
    )}

    {/* Readonly metrics */}
    <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
      <ShareScore averageScore={post.averageScore} ratingCount={post.ratingCount} size="lg" />
      <span className="inline-flex items-center gap-1 text-[11px] font-black tabular-nums text-muted-foreground/50">
        <MessageCircle className="h-4 w-4" />
        {post.commentCount}
      </span>
      <span className="inline-flex items-center gap-1 text-[11px] font-black tabular-nums text-muted-foreground/50">
        <Bookmark className="h-4 w-4" />
        {post.bookmarkCount}
      </span>
      <span className="ml-auto inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground/40">
        <Eye className="h-4 w-4" />
        {post.impressionCount}
      </span>
    </div>
  </article>
)
