import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { ChevronLeft, X, Pencil, ExternalLink, Calendar, MapPin } from 'lucide-react'
import { getR2Url } from '@/lib/r2'
import { validateAllowedImageFiles } from '@/lib/fileValidation'
import { ShopPhotoUploadInput } from '@/components/shop/ShopPhotoUploadInput'
import { inputClass } from '@/components/shop/ShopFormUI'
import {
  useShopBanners,
  useCreateShopBanner,
  useUpdateShopBanner,
  useDeleteShopBanner,
  SHOP_BANNER_BUCKET,
} from '@/hooks/useShopBanners'
import {
  isBannerLive,
  formatBannerPeriod,
  toLocalDatetimeInput,
  BANNER_PLACEMENTS,
  bannerPlacementLabel,
} from '@/lib/shopBanner'
import { cn } from '@/lib/utils'
import type { ShopBanner, ShopBannerFormValues, BannerPlacement } from '@/types'

const getBannerUrl = (imagePath: string) => getR2Url(SHOP_BANNER_BUCKET, imagePath)

const EMPTY_FORM: ShopBannerFormValues = {
  linkUrl: '',
  isActive: true,
  startsAt: '',
  endsAt: '',
  placements: ['shop_detail'],
}

const togglePlacement = (
  placements: BannerPlacement[],
  placement: BannerPlacement,
): BannerPlacement[] =>
  placements.includes(placement)
    ? placements.filter((p) => p !== placement)
    : [...placements, placement]

// ── 期間・リンク・公開のフォーム部品 ────────────────────────────

interface BannerFieldsProps {
  values: ShopBannerFormValues
  onChange: (values: ShopBannerFormValues) => void
}

const BannerFields = ({ values, onChange }: BannerFieldsProps) => (
  <div className="space-y-4">
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        リンク先 URL（任意）
      </label>
      <input
        type="url"
        inputMode="url"
        placeholder="https://example.com"
        value={values.linkUrl}
        onChange={(e) => onChange({ ...values, linkUrl: e.target.value })}
        className={inputClass}
      />
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          掲載開始（任意）
        </label>
        <input
          type="datetime-local"
          value={values.startsAt}
          onChange={(e) => onChange({ ...values, startsAt: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          掲載終了（任意）
        </label>
        <input
          type="datetime-local"
          value={values.endsAt}
          onChange={(e) => onChange({ ...values, endsAt: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>

    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        表示位置（1つ以上）
      </label>
      <div className="flex flex-col gap-2">
        {BANNER_PLACEMENTS.map((p) => (
          <label
            key={p.value}
            className="flex w-fit cursor-pointer items-center gap-2 text-xs text-foreground/70"
          >
            <input
              type="checkbox"
              checked={values.placements.includes(p.value)}
              onChange={() => onChange({ ...values, placements: togglePlacement(values.placements, p.value) })}
              className="h-4 w-4 accent-primary"
            />
            {p.label}
          </label>
        ))}
      </div>
    </div>

    <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-foreground/70">
      <input
        type="checkbox"
        checked={values.isActive}
        onChange={(e) => onChange({ ...values, isActive: e.target.checked })}
        className="h-4 w-4 accent-primary"
      />
      公開する
    </label>
  </div>
)

// ── 既存バナー行（編集・削除） ──────────────────────────────────

interface BannerRowProps {
  banner: ShopBanner
  shopId: string
}

const BannerRow = ({ banner, shopId }: BannerRowProps) => {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<ShopBannerFormValues>({
    linkUrl: banner.linkUrl ?? '',
    isActive: banner.isActive,
    startsAt: toLocalDatetimeInput(banner.startsAt),
    endsAt: toLocalDatetimeInput(banner.endsAt),
    placements: banner.placements,
  })
  const [error, setError] = useState<string | null>(null)

  const { mutate: update, isPending: isUpdating } = useUpdateShopBanner(shopId)
  const { mutate: remove, isPending: isDeleting } = useDeleteShopBanner(shopId)

  const live = isBannerLive(banner)

  const handleSave = () => {
    if (values.placements.length === 0) {
      setError('表示位置を1つ以上選択してください')
      return
    }
    setError(null)
    update(
      { id: banner.id, values },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => setError(err instanceof Error ? err.message : '更新に失敗しました'),
      },
    )
  }

  const handleDelete = () => {
    if (!window.confirm('このバナーを削除しますか？')) return
    remove({ id: banner.id, imagePath: banner.imagePath })
  }

  return (
    <div className="border border-border bg-white editorial-shadow">
      <div className="flex gap-4 p-4">
        <div className="relative aspect-[16/5] w-32 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-44">
          <img src={getBannerUrl(banner.imagePath)} alt="" className="h-full w-full object-cover" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="space-y-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
                live ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', live ? 'bg-emerald-400' : 'bg-muted-foreground/40')} />
              {live ? '掲載中' : '非掲載'}
            </span>

            {banner.linkUrl && (
              <a
                href={banner.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 truncate text-[11px] text-muted-foreground/70 transition-colors hover:text-primary"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{banner.linkUrl}</span>
              </a>
            )}

            <p className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatBannerPeriod(banner)}
            </p>

            {banner.placements.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {banner.placements.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground/60"
                  >
                    <MapPin className="h-2.5 w-2.5" />
                    {bannerPlacementLabel(p)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Pencil className="h-3 w-3" />
              編集
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-500/70 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-40"
            >
              <X className="h-3 w-3" />
              削除
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="space-y-4 border-t border-border bg-muted/20 p-4">
          <BannerFields values={values} onChange={setValues} />
          {error && <p className="text-[10px] font-medium text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isUpdating ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="border border-border px-4 py-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground/60"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 新規追加フォーム ────────────────────────────────────────────

interface AddBannerFormProps {
  shopId: string
  nextOrder: number
}

const AddBannerForm = ({ shopId, nextOrder }: AddBannerFormProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [values, setValues] = useState<ShopBannerFormValues>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const { mutate: create, isPending } = useCreateShopBanner(shopId)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    try {
      await validateAllowedImageFiles(files)
      setFile(files[0])
      setPreviewUrl(URL.createObjectURL(files[0]))
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像が不正です')
    }
  }

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setValues(EMPTY_FORM)
  }

  const handleSubmit = () => {
    if (!file) {
      setError('バナー画像を選択してください')
      return
    }
    if (values.placements.length === 0) {
      setError('表示位置を1つ以上選択してください')
      return
    }
    setError(null)
    create(
      { file, values, nextOrder },
      {
        onSuccess: reset,
        onError: (err) => setError(err instanceof Error ? err.message : 'バナーの追加に失敗しました'),
      },
    )
  }

  return (
    <div className="space-y-4 border border-dashed border-border bg-white p-5">
      <p className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">
        バナーを追加
      </p>

      {previewUrl ? (
        <div className="relative aspect-[16/5] w-full overflow-hidden rounded-sm bg-muted md:aspect-[1200/250]">
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setFile(null)
              setPreviewUrl(null)
            }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <ShopPhotoUploadInput
          onChange={handleFileChange}
          multiple={false}
          idleLabel="バナー画像を選択"
        />
      )}

      <BannerFields values={values} onChange={setValues} />

      {error && <p className="text-[10px] font-medium text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !file}
        className="w-full bg-primary py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? '追加中...' : 'バナーを追加'}
      </button>

      <p className="text-[10px] text-muted-foreground/40">
        推奨アスペクト比 1200 × 250 · JPEG / PNG / WebP
      </p>
    </div>
  )
}

// ── ページ ────────────────────────────────────────────────────

const OwnerShopBannersPage = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const { data: banners = [], isLoading, isError } = useShopBanners(shopId ?? '')

  const nextOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.order)) + 1 : 0

  return (
    <div className="min-h-[calc(100dvh-56px)]">
      {/* ── Page header ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            BANNER
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to="/owner"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボードへ
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Owner</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              店舗バナー
            </h1>
          </div>
        </div>
      </section>

      {/* ── Description ────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 md:px-16">
          <p className="text-[11px] text-muted-foreground/60">
            店舗詳細ページの上部に表示されるバナーです。掲載期間を指定すると、その期間だけ自動で表示されます。
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-16 md:py-14">
          {shopId && <AddBannerForm shopId={shopId} nextOrder={nextOrder} />}

          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {isError && (
            <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">バナーの取得に失敗しました。</p>
            </div>
          )}

          {!isLoading && !isError && shopId && (
            <div className="space-y-3">
              {banners.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground/50">
                  まだバナーがありません。
                </p>
              ) : (
                banners.map((banner) => (
                  <BannerRow key={banner.id} banner={banner} shopId={shopId} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OwnerShopBannersPage
