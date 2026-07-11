import { useParams, useNavigate, Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useSharePost } from '@/hooks/useSharePosts'
import { SharePostForm } from '@/components/share/SharePostForm'
import { Seo } from '@/components/seo/Seo'

const SharePostEditPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: post, isLoading } = useSharePost(id)

  if (isLoading) {
    return <p className="py-24 text-center text-sm text-muted-foreground/40">読み込み中…</p>
  }

  if (!post || (user && post.userId !== user.id)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="mb-4 text-sm text-muted-foreground">この投稿を編集できません。</p>
        <Link to="/share" className="text-xs font-bold text-primary underline-offset-2 hover:underline">
          シャレ活タイムラインへ戻る
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Seo title="シャレ活を編集" description="シャレ活の投稿を編集します。" path={`/share/${id}/edit`} noindex />

      {/* Minimal editorial header */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 md:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/35 transition-colors hover:text-foreground/70"
          >
            ← Back
          </button>
          <p className="text-sm font-bold text-foreground">シャレ活を編集</p>
          <div className="w-14" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        <SharePostForm mode="edit" initial={post} />
      </div>
    </div>
  )
}

export default SharePostEditPage
