import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ChevronLeft, Loader2, AlertTriangle } from 'lucide-react'
import { useShopItem, useUpdateShopItem, useDeleteShopItem } from '@/hooks/useShopItems'
import ShopItemForm, { type ShopItemFormSubmit } from '@/components/owner/ShopItemForm'

const ShopItemEditPage = () => {
  const { shopId, itemId } = useParams<{ shopId: string; itemId: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading, error: loadError } = useShopItem(itemId ?? '')
  const { mutate: updateItem, isPending: isUpdating } = useUpdateShopItem()
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteShopItem(shopId ?? '')

  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const itemsHref = `/owner/shops/${shopId}/items`

  const handleSubmit = ({ values, newPhotoFiles, deletedPhotoIds, deletedPhotoPaths }: ShopItemFormSubmit) => {
    if (!shopId || !itemId) return
    setError(null)
    updateItem(
      { itemId, shopId, values, newPhotoFiles, deletedPhotoIds, deletedPhotoPaths },
      {
        onSuccess: () => navigate(itemsHref),
        onError: (err) => setError(err instanceof Error ? err.message : '更新に失敗しました'),
      },
    )
  }

  const handleDelete = () => {
    if (!itemId || !item) return
    deleteItem(
      { itemId, photoPaths: item.photos.map((p) => p.storagePath) },
      {
        onSuccess: () => navigate(itemsHref),
        onError: (err) => setError(err instanceof Error ? err.message : '削除に失敗しました'),
      },
    )
  }

  return (
    <div className="min-h-[calc(100dvh-56px)]">

      {/* ── Page header ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            EDIT ITEM
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to={itemsHref}
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              アイテム一覧へ
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Owner</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              アイテムを編集
            </h1>
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────── */}
      <div className="bg-background">
        {isLoading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
          </div>
        )}

        {!isLoading && (loadError || !item) && (
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground/50">アイテムが見つかりませんでした</p>
            <Link
              to={itemsHref}
              className="bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
            >
              アイテム一覧へ戻る
            </Link>
          </div>
        )}

        {!isLoading && item && (
          <ShopItemForm
            shopId={shopId ?? ''}
            initialItem={item}
            submitting={isUpdating}
            submitLabel="保存する"
            errorMessage={error}
            onSubmit={handleSubmit}
            onCancel={() => navigate(itemsHref)}
            onDelete={() => setConfirmDelete(true)}
            deleting={isDeleting}
          />
        )}
      </div>

      {/* ── Delete confirmation ──────────────────────── */}
      {confirmDelete && item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm border border-border bg-white p-6 editorial-shadow">
            <h2 className="font-headline text-lg font-black tracking-tight">アイテムを削除しますか？</h2>
            <p className="mt-2 text-xs text-muted-foreground/60">
              「{item.name}」を削除します。写真を含むすべてのデータが削除され、元に戻せません。
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
                className="flex-1 border border-border bg-white py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-40"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-500 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    削除中...
                  </span>
                ) : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShopItemEditPage
