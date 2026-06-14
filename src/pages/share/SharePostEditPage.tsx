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

      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            EDIT
          </span>
        </div>
        <div className="relative mx-auto max-w-2xl pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
          >
            ← Back
          </button>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Share</p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">シャレ活を編集</h1>
        </div>
      </section>

      <div className="bg-background">
        <div className="mx-auto max-w-2xl px-4 py-10 md:px-8 md:py-14">
          <SharePostForm mode="edit" initial={post} />
        </div>
      </div>
    </div>
  )
}

export default SharePostEditPage
