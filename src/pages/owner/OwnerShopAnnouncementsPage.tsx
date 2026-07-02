import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { ChevronLeft, X, Pencil, ExternalLink, Calendar } from 'lucide-react'
import { getR2Url } from '@/lib/r2'
import { safeExternalHref } from '@/lib/url'
import { validateAllowedImageFiles } from '@/lib/fileValidation'
import { ShopPhotoUploadInput } from '@/components/shop/ShopPhotoUploadInput'
import { inputClass } from '@/components/shop/ShopFormUI'
import {
  useShopAnnouncements,
  useCreateShopAnnouncement,
  useUpdateShopAnnouncement,
  useDeleteShopAnnouncement,
  SHOP_ANNOUNCEMENT_BUCKET,
} from '@/hooks/useShopAnnouncements'
import {
  isAnnouncementLive,
  formatAnnouncementPeriod,
  toLocalDatetimeInput,
} from '@/lib/shopAnnouncement'
import { useShopSubscription } from '@/hooks/useShopSubscription'
import { OwnerPremiumLock } from '@/components/owner/OwnerPremiumLock'
import { cn } from '@/lib/utils'
import type { ShopAnnouncement, ShopAnnouncementFormValues } from '@/types'

const getImageUrl = (imagePath: string) => getR2Url(SHOP_ANNOUNCEMENT_BUCKET, imagePath)

const textareaClass = cn(
  'w-full rounded-sm border border-border bg-white px-3 py-2 text-sm text-foreground',
  'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
)

const EMPTY_FORM: ShopAnnouncementFormValues = {
  title: '',
  body: '',
  linkUrl: '',
  isActive: true,
  startsAt: '',
  endsAt: '',
}

// ── タイトル・本文・リンク・期間・公開のフォーム部品 ───────────────

interface AnnouncementFieldsProps {
  values: ShopAnnouncementFormValues
  onChange: (values: ShopAnnouncementFormValues) => void
}

const AnnouncementFields = ({ values, onChange }: AnnouncementFieldsProps) => (
  <div className="space-y-4">
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        タイトル（必須）
      </label>
      <input
        type="text"
        placeholder="例：夏季セールのお知らせ"
        value={values.title}
        onChange={(e) => onChange({ ...values, title: e.target.value })}
        className={inputClass}
      />
    </div>

    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
        本文（必須）
      </label>
      <textarea
        rows={4}
        placeholder="お知らせの内容を入力してください"
        value={values.body}
        onChange={(e) => onChange({ ...values, body: e.target.value })}
        className={textareaClass}
      />
    </div>

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

// ── 画像（任意）入力 ────────────────────────────────────────────

interface ImageInputProps {
  previewUrl: string | null
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}

const ImageInput = ({ previewUrl, onSelect, onClear }: ImageInputProps) =>
  previewUrl ? (
    <div className="relative aspect-[4/3] w-32 overflow-hidden rounded-sm bg-muted">
      <img src={previewUrl} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onClear}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  ) : (
    <ShopPhotoUploadInput onChange={onSelect} multiple={false} idleLabel="サムネ画像を選択（任意）" />
  )

// ── 既存お知らせ行（編集・削除） ────────────────────────────────

interface AnnouncementRowProps {
  announcement: ShopAnnouncement
  shopId: string
}

const AnnouncementRow = ({ announcement, shopId }: AnnouncementRowProps) => {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<ShopAnnouncementFormValues>({
    title: announcement.title,
    body: announcement.body,
    linkUrl: announcement.linkUrl ?? '',
    isActive: announcement.isActive,
    startsAt: toLocalDatetimeInput(announcement.startsAt),
    endsAt: toLocalDatetimeInput(announcement.endsAt),
  })
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    announcement.imagePath ? getImageUrl(announcement.imagePath) : null,
  )
  const [removeImage, setRemoveImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate: update, isPending: isUpdating } = useUpdateShopAnnouncement(shopId)
  const { mutate: remove, isPending: isDeleting } = useDeleteShopAnnouncement(shopId)

  const live = isAnnouncementLive(announcement)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    try {
      await validateAllowedImageFiles(files)
      setFile(files[0])
      setPreviewUrl(URL.createObjectURL(files[0]))
      setRemoveImage(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像が不正です')
    }
  }

  const handleClearImage = () => {
    setFile(null)
    setPreviewUrl(null)
    setRemoveImage(true)
  }

  const handleSave = () => {
    if (!values.title.trim() || !values.body.trim()) {
      setError('タイトルと本文は必須です')
      return
    }
    setError(null)
    update(
      { id: announcement.id, values, file, currentImagePath: announcement.imagePath, removeImage },
      {
        onSuccess: () => {
          setEditing(false)
          setFile(null)
        },
        onError: (err) => setError(err instanceof Error ? err.message : '更新に失敗しました'),
      },
    )
  }

  const handleDelete = () => {
    if (!window.confirm('このお知らせを削除しますか？')) return
    remove({ id: announcement.id, imagePath: announcement.imagePath })
  }

  return (
    <div className="border border-border bg-white editorial-shadow">
      <div className="flex gap-4 p-4">
        {announcement.imagePath && (
          <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-32">
            <img src={getImageUrl(announcement.imagePath)} alt="" className="h-full w-full object-cover" />
          </div>
        )}

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

            <h3 className="truncate font-headline text-sm font-black text-foreground">
              {announcement.title}
            </h3>

            <p className="line-clamp-2 text-[11px] text-muted-foreground/70">{announcement.body}</p>

            {announcement.linkUrl && (
              <a
                href={safeExternalHref(announcement.linkUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 truncate text-[11px] text-muted-foreground/70 transition-colors hover:text-primary"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{announcement.linkUrl}</span>
              </a>
            )}

            <p className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Calendar className="h-3 w-3 shrink-0" />
              {formatAnnouncementPeriod(announcement)}
            </p>
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
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              サムネ画像（任意）
            </label>
            <ImageInput previewUrl={previewUrl} onSelect={handleFileChange} onClear={handleClearImage} />
          </div>
          <AnnouncementFields values={values} onChange={setValues} />
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

interface AddAnnouncementFormProps {
  shopId: string
}

const AddAnnouncementForm = ({ shopId }: AddAnnouncementFormProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [values, setValues] = useState<ShopAnnouncementFormValues>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const { mutate: create, isPending } = useCreateShopAnnouncement(shopId)

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
    if (!values.title.trim() || !values.body.trim()) {
      setError('タイトルと本文は必須です')
      return
    }
    setError(null)
    create(
      { values, file },
      {
        onSuccess: reset,
        onError: (err) => setError(err instanceof Error ? err.message : 'お知らせの追加に失敗しました'),
      },
    )
  }

  return (
    <div className="space-y-4 border border-dashed border-border bg-white p-5">
      <p className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">
        お知らせを追加
      </p>

      <div>
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          サムネ画像（任意）
        </label>
        <ImageInput
          previewUrl={previewUrl}
          onSelect={handleFileChange}
          onClear={() => {
            setFile(null)
            setPreviewUrl(null)
          }}
        />
      </div>

      <AnnouncementFields values={values} onChange={setValues} />

      {error && <p className="text-[10px] font-medium text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-primary py-2.5 text-[11px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {isPending ? '追加中...' : 'お知らせを追加'}
      </button>

      <p className="text-[10px] text-muted-foreground/40">
        画像は任意 · JPEG / PNG / WebP
      </p>
    </div>
  )
}

// ── ページ ────────────────────────────────────────────────────

const OwnerShopAnnouncementsPage = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const { isPremium, isLoading: isSubLoading } = useShopSubscription(shopId)
  const { data: announcements = [], isLoading, isError } = useShopAnnouncements(shopId ?? '', {
    enabled: isPremium,
  })

  if (isSubLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] justify-center bg-background py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isPremium) {
    return <OwnerPremiumLock feature="announcements" />
  }

  return (
    <div className="min-h-[calc(100dvh-56px)]">
      {/* ── Page header ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            NEWS
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
              店舗お知らせ
            </h1>
          </div>
        </div>
      </section>

      {/* ── Description ────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 md:px-16">
          <p className="text-[11px] text-muted-foreground/60">
            店舗詳細ページに表示されるお知らせです。掲載期間を指定すると、その期間だけ自動で表示されます。
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-16 md:py-14">
          {shopId && <AddAnnouncementForm shopId={shopId} />}

          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {isError && (
            <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">お知らせの取得に失敗しました。</p>
            </div>
          )}

          {!isLoading && !isError && shopId && (
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground/50">
                  まだお知らせがありません。
                </p>
              ) : (
                announcements.map((announcement) => (
                  <AnnouncementRow key={announcement.id} announcement={announcement} shopId={shopId} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OwnerShopAnnouncementsPage
