import { Link } from 'react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useMyWishes, useDeleteWish } from '@/hooks/useWishes'
import { Button } from '@/components/ui/button'
import type { Wish } from '@/types'

const URGENCY_LABEL: Record<NonNullable<Wish['urgency']>, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const WishCard = ({ wish }: { wish: Wish }) => {
  const { mutate: deleteWish, isPending } = useDeleteWish()

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {wish.category.name}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {wish.area.city}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {wish.priceRange.label}
            </span>
            {wish.urgency && (
              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
                優先度: {URGENCY_LABEL[wish.urgency]}
              </span>
            )}
          </div>

          {wish.note && (
            <p className="text-sm text-muted-foreground line-clamp-2">{wish.note}</p>
          )}

          {wish.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {wish.tags.map((tag, i) => (
                <span key={i} className="text-xs text-muted-foreground">#{tag}</span>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            {wish.isPublic ? '公開中' : '非公開'} ·{' '}
            {new Date(wish.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>

        <button
          onClick={() => deleteWish(wish.id)}
          disabled={isPending}
          className="shrink-0 text-muted-foreground hover:text-red-500 disabled:opacity-50"
          title="削除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const WishesPage = () => {
  const { data: wishes, isLoading, isError } = useMyWishes()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ウィッシュリスト</h1>
        <Button asChild>
          <Link to="/wishes/new">
            <Plus className="h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          ウィッシュリストの読み込みに失敗しました
        </div>
      )}

      {!isLoading && !isError && wishes?.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="mb-4">ウィッシュリストが空です</p>
          <Button asChild>
            <Link to="/wishes/new">ウィッシュを追加する</Link>
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {wishes?.map((wish) => (
          <WishCard key={wish.id} wish={wish} />
        ))}
      </div>
    </div>
  )
}

export default WishesPage
