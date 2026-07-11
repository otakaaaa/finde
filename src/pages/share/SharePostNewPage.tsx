import { useNavigate, useSearchParams } from 'react-router'
import { SharePostForm } from '@/components/share/SharePostForm'
import { Seo } from '@/components/seo/Seo'

const SharePostNewPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 店舗詳細の「投稿する」導線から遷移した場合、その店舗を関連店舗に選択済みにする
  const shopId = searchParams.get('shopId')
  const shopName = searchParams.get('shopName')
  const initialShops = shopId && shopName ? [{ id: shopId, name: shopName }] : undefined

  return (
    <div>
      <Seo title="シャレ活を投稿" description="あなたのシャレ活を投稿しましょう。" path="/share/new" noindex />

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
          <p className="text-sm font-bold text-foreground">シャレ活を投稿</p>
          <div className="w-14" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        <SharePostForm mode="create" initialShops={initialShops} />
      </div>
    </div>
  )
}

export default SharePostNewPage
