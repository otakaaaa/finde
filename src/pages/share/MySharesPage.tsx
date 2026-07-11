import { Link } from 'react-router'
import { Pencil, Trash2, PenLine } from 'lucide-react'
import { useMyShares } from '@/hooks/useSharePosts'
import { useDeleteShare } from '@/hooks/useShareMutations'
import { SharePostCard } from '@/components/share/SharePostCard'
import { ShareMypageNav } from '@/components/share/ShareMypageNav'
import { Seo } from '@/components/seo/Seo'
import type { SharePost } from '@/types'

const ManagedPost = ({ post }: { post: SharePost }) => {
  const del = useDeleteShare()

  const handleDelete = () => {
    if (!window.confirm('この投稿を削除しますか？この操作は取り消せません。')) return
    del.mutate(post.id)
  }

  return (
    <div>
      <SharePostCard post={post} showVisibility />
      <div className="mt-1.5 flex items-center justify-end gap-3 px-1">
        <Link
          to={`/share/${post.id}/edit`}
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
          編集
        </Link>
        <button
          onClick={handleDelete}
          disabled={del.isPending}
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-red-500 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          削除
        </button>
      </div>
    </div>
  )
}

const MySharesPage = () => {
  const { data: posts, isLoading } = useMyShares()

  return (
    <div className="bg-background">
      <Seo title="シャレ活の管理" description="自分のシャレ活投稿を管理します。" path="/mypage/share" noindex />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-headline text-2xl font-black tracking-tight text-foreground">シャレ活</h1>
          <Link
            to="/share/new"
            className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
          >
            <PenLine className="h-3.5 w-3.5" />
            投稿する
          </Link>
        </div>

        <ShareMypageNav />

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground/40">読み込み中…</p>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <ManagedPost key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground/40">公開中の投稿はありません。</p>
        )}
      </div>
    </div>
  )
}

export default MySharesPage
