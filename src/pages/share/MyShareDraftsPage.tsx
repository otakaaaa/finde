import { Link } from 'react-router'
import { Pencil, Trash2, Send } from 'lucide-react'
import { useMyDrafts } from '@/hooks/useSharePosts'
import { useUpdateShare, useDeleteShare } from '@/hooks/useShareMutations'
import { ShareMypageNav } from '@/components/share/ShareMypageNav'
import { useUiStore } from '@/store/uiStore'
import { Seo } from '@/components/seo/Seo'
import type { SharePost } from '@/types'

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })

const DraftItem = ({ draft }: { draft: SharePost }) => {
  const update = useUpdateShare()
  const del = useDeleteShare()
  const { addToast } = useUiStore()

  const handlePublish = () => {
    update.mutate(
      {
        id: draft.id,
        body: draft.body,
        visibility: draft.visibility,
        state: 'published',
        shopIds: draft.shops.map((s) => s.id),
        keepPhotoIds: draft.photos.map((p) => p.id),
        newFiles: [],
      },
      { onSuccess: () => addToast({ title: '投稿を公開しました', variant: 'default' }) },
    )
  }

  const handleDelete = () => {
    if (!window.confirm('この下書きを削除しますか？')) return
    del.mutate(draft.id)
  }

  return (
    <div className="border-l-[3px] border-l-border bg-white px-4 py-4 editorial-shadow sm:px-5">
      <p className="text-[9px] tabular-nums text-muted-foreground/40">最終更新 {formatDate(draft.updatedAt)}</p>
      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[13px] leading-[1.7] text-foreground/75">
        {draft.body || '（本文なし）'}
      </p>
      <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
        <button
          onClick={handlePublish}
          disabled={update.isPending}
          className="inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-3 w-3" />
          公開する
        </button>
        <Link
          to={`/share/${draft.id}/edit`}
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
          編集
        </Link>
        <button
          onClick={handleDelete}
          disabled={del.isPending}
          className="ml-auto inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-red-500 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          削除
        </button>
      </div>
    </div>
  )
}

const MyShareDraftsPage = () => {
  const { data: drafts, isLoading } = useMyDrafts()

  return (
    <div className="bg-background">
      <Seo title="シャレ活の下書き" description="シャレ活の下書きを管理します。" path="/mypage/share/drafts" noindex />

      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <h1 className="mb-6 font-headline text-2xl font-black tracking-tight text-foreground">シャレ活</h1>
        <ShareMypageNav />

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground/40">読み込み中…</p>
        ) : drafts && drafts.length > 0 ? (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <DraftItem key={draft.id} draft={draft} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground/40">下書きはありません。</p>
        )}
      </div>
    </div>
  )
}

export default MyShareDraftsPage
