import { useParams, useNavigate, Link } from 'react-router'
import { ArrowRight, Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSharePost } from '@/hooks/useSharePosts'
import { SharePostView } from '@/components/share/SharePostView'
import { ShareRatingInput } from '@/components/share/ShareRatingInput'
import { ShareBookmarkButton } from '@/components/share/ShareBookmarkButton'
import { ShareToXButton } from '@/components/share/ShareToXButton'
import { ShareComments } from '@/components/share/ShareComments'
import { Seo } from '@/components/seo/Seo'

const SharePostDetailPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: post, isLoading } = useSharePost(id)

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

  return (
    <div className="bg-background">
      <Seo
        title="シャレ活"
        description={post.body.slice(0, 100)}
        path={`/share/${post.id}`}
      />

      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 transition-colors hover:text-foreground"
        >
          ← Back
        </button>

        <div className="border-l-[3px] border-l-border bg-white px-5 py-6 editorial-shadow">
          <SharePostView post={post} />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-4 px-1">
          <ShareBookmarkButton post={post} />
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

        {/* Rating */}
        <div className="mt-6 border-t border-border pt-6">
          <ShareRatingInput post={post} />
        </div>

        {/* Comments */}
        <div className="mt-8 border-t border-border pt-6">
          <ShareComments postId={post.id} />
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
    </div>
  )
}

export default SharePostDetailPage
