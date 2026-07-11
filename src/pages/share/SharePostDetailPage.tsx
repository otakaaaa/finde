import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowRight, Pencil, MessageCircle, Eye, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSharePost } from '@/hooks/useSharePosts'
import { SharePhotoGallery } from '@/components/share/SharePhotoGallery'
import { ShareShopChips } from '@/components/share/ShareShopChips'
import { ShareScore } from '@/components/share/ShareScore'
import { ShareBookmarkButton } from '@/components/share/ShareBookmarkButton'
import { ShareToXButton } from '@/components/share/ShareToXButton'
import { ShareRatingPopover } from '@/components/share/ShareRatingPopover'
import { ShareCommentSheet } from '@/components/share/ShareCommentSheet'
import { getSharePhotoUrl } from '@/components/share/sharePhoto'
import { ShareUserAvatar } from '@/components/share/ShareUserAvatar'

const formatDate = (dateStr: string | null) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : ''

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
      {/* SEOメタはルートの meta エクスポート（routes/share-post-detail.tsx）が出力する */}

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
            <ShareUserAvatar displayName={post.user.displayName} avatarUrl={post.user.avatarUrl} size="lg" />
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
              <ShareScore totalScore={post.ratingSum} ratingCount={post.ratingCount} size="lg" />
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRatingOpen((v) => !v)}
                  className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                  aria-label="シャレ度を送る"
                  aria-expanded={ratingOpen}
                >
                  <ShareScore totalScore={post.ratingSum} ratingCount={post.ratingCount} size="lg" />
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

      <ShareCommentSheet
        postId={post.id}
        commentCount={post.commentCount}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </div>
  )
}

export default SharePostDetailPage
