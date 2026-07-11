import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useCreateShopItem } from '@/hooks/useShopItems'
import ShopItemForm, { type ShopItemFormSubmit } from '@/components/owner/ShopItemForm'

const ShopItemNewPage = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()
  const { mutate: createItem, isPending } = useCreateShopItem()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = ({ values, newPhotoFiles }: ShopItemFormSubmit) => {
    if (!shopId) return
    setError(null)
    createItem(
      { shopId, values, photoFiles: newPhotoFiles },
      {
        onSuccess: () => navigate(`/owner/shops/${shopId}/items`),
        onError: (err) => setError(err instanceof Error ? err.message : '登録に失敗しました'),
      },
    )
  }

  return (
    <div className="min-h-[calc(100dvh-56px)]">

      {/* ── Page header ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            NEW ITEM
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to={`/owner/shops/${shopId}/items`}
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 transition-colors hover:text-foreground/60"
            >
              <ChevronLeft className="h-3 w-3" />
              アイテム一覧へ
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">— Owner</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
              アイテムを登録
            </h1>
          </div>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────────── */}
      <div className="bg-background">
        <ShopItemForm
          shopId={shopId ?? ''}
          submitting={isPending}
          submitLabel="登録する"
          errorMessage={error}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/owner/shops/${shopId}/items`)}
        />
      </div>
    </div>
  )
}

export default ShopItemNewPage
