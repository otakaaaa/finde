import { X, Lock, Globe, Store } from 'lucide-react'
import { SharePhotoGallery } from '@/components/share/SharePhotoGallery'
import type { ShareVisibility } from '@/types'
import type { PickedShop } from '@/components/share/ShareShopPicker'

interface SharePreviewModalProps {
  authorName: string
  body: string
  visibility: ShareVisibility
  photoUrls: string[]
  shops: PickedShop[]
  onClose: () => void
}

/** 公開後の見え方を確認するプレビュー（保存しない）。 */
export const SharePreviewModal = ({
  authorName,
  body,
  visibility,
  photoUrls,
  shops,
  onClose,
}: SharePreviewModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-2xl rounded-sm bg-white editorial-shadow"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
          プレビュー
        </span>
        <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground" aria-label="閉じる">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 py-6">
        {/* Author */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted font-headline text-[13px] font-black text-muted-foreground/60">
            {authorName[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-headline text-[13px] font-black tracking-tight text-foreground/90">{authorName}</p>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
              {visibility === 'public' ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
              {visibility === 'public' ? '公開' : '非公開'}
            </p>
          </div>
        </div>

        {body ? (
          <p className="whitespace-pre-wrap text-[14px] leading-[1.9] text-foreground/80">{body}</p>
        ) : (
          <p className="text-[13px] italic text-muted-foreground/40">本文がありません</p>
        )}

        {photoUrls.length > 0 && (
          <div className="mt-4">
            <SharePhotoGallery urls={photoUrls} />
          </div>
        )}

        {shops.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {shops.map((shop) => (
              <span
                key={shop.id}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-white px-2.5 py-1 text-[10px] font-bold text-foreground/70"
              >
                <Store className="h-3 w-3 text-muted-foreground/40" />
                {shop.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)
