import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { ChevronLeft, Store, Check, ArrowRight, Globe, Instagram, Phone, X } from 'lucide-react'
import { XLogo } from '@/components/icons/XLogo'
import { TikTokLogo } from '@/components/icons/TikTokLogo'
import { supabase } from '@/lib/supabase'
import { validateAllowedImageFiles } from '@/lib/fileValidation'
import { ShopPhotoUploadInput } from '@/components/shop/ShopPhotoUploadInput'
import { useAuth } from '@/hooks/useAuth'
import { useShopMasterData } from '@/hooks/useShopMasterData'
import { SectionLabel, Field, inputClass, selectClass } from '@/components/shop/ShopFormUI'
import {
  ShopBusinessHoursSection,
  businessHoursSchema,
  toBusinessHours,
  DEFAULT_HOURS_ENTRY,
  type DayKey,
} from '@/components/shop/ShopBusinessHoursSection'
import { cn } from '@/lib/utils'
import { OWNER_FEATURE_ENABLED } from '@/config/features'
import type { Path } from 'react-hook-form'

const BUCKET = 'shop-photos'

const listingRequestSchema = z.object({
  shopName:      z.string().min(1, '店舗名を入力してください').max(100),
  description:   z.string().max(2000).optional(),
  prefectureId:  z.number({ required_error: '都道府県を選択してください', invalid_type_error: '都道府県を選択してください' }),
  cityId:        z.number().optional(),
  address:       z.string().max(200).optional(),
  priceRangeId:  z.number().optional(),
  categoryIds:   z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  phone:         z.string().max(20).optional(),
  websiteUrl:    z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  instagramUrl:  z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl:    z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  tiktokUrl:     z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  businessHours: businessHoursSchema,
  note:          z.string().max(500).optional(),
})

type ListingRequestFormValues = z.infer<typeof listingRequestSchema>

const PROCESS_STEPS = [
  { num: '01', label: '申請フォームの送信', desc: '店舗情報を入力して送信' },
  { num: '02', label: 'フクナビ運営による審査', desc: '通常2〜5営業日' },
  { num: '03', label: '掲載開始のご連絡', desc: 'メールにてお知らせ' },
]

// ── Submitted ─────────────────────────────────────────────────

const SubmittedScreen = ({ onBack }: { onBack: () => void }) => (
  <div>
    <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
      <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
        <span
          className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
          style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
        >
          DONE
        </span>
      </div>
      <div className="relative mx-auto max-w-3xl pb-6">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Application</p>
        <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
          SUBMITTED
        </h1>
      </div>
    </section>

    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-16 md:py-20">
        <div className="wish-card-enter mb-8 border-l-[3px] border-l-emerald-400 bg-white p-6 editorial-shadow">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-emerald-50">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/70">
              掲載申請を受け付けました。
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            フクナビ運営が内容を確認の上、審査完了後にメールにてご連絡いたします。<br />
            通常2〜5営業日程度お時間をいただきます。
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-primary px-6 py-3 text-xs font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90"
          >
            トップへ戻る
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
)

// ── Page ──────────────────────────────────────────────────────

const ListingRequestPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: masterData } = useShopMasterData()
  const [submitted, setSubmitted] = useState(false)

  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  useEffect(() => {
    const urls = pendingFiles.map((f) => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [pendingFiles])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploadingPhotos(true)
    setPhotoError(null)
    try {
      await validateAllowedImageFiles(files)
      setPendingFiles((prev) => [...prev, ...files])
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : '画像の検証に失敗しました')
    } finally {
      setUploadingPhotos(false)
    }
  }

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (values: ListingRequestFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      // 1. 申請レコードを作成
      const { data: request, error: insertError } = await supabase
        .from('shop_listing_requests')
        .insert({
          submitted_by:   user.id,
          shop_name:      values.shopName,
          description:    values.description || null,
          prefecture_id:  values.prefectureId,
          city_id:        values.cityId ?? null,
          address:        values.address || null,
          price_range_id: values.priceRangeId ?? null,
          category_ids:   values.categoryIds,
          phone:          values.phone || null,
          website_url:    values.websiteUrl || null,
          instagram_url:  values.instagramUrl || null,
          twitter_url:    values.twitterUrl || null,
          tiktok_url:     values.tiktokUrl || null,
          business_hours: toBusinessHours(values.businessHours),
          note:           values.note || null,
          is_owner_request: false,
        } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (insertError) throw new Error(insertError.message)
      if (!request) throw new Error('申請の送信に失敗しました')

      // 2. 写真をアップロード
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i]
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `listing-requests/${request.id}/${crypto.randomUUID()}.${ext}`
        const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file)
        if (storageErr) throw new Error(storageErr.message)
        const { error: photoErr } = await supabase
          .from('listing_request_photos')
          .insert({ request_id: request.id, storage_path: path, order: i } as never) as unknown as {
            error: { message: string } | null
          }
        if (photoErr) {
          await supabase.storage.from(BUCKET).remove([path])
          throw new Error(photoErr.message)
        }
      }
    },
    onSuccess: () => setSubmitted(true),
  })

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<ListingRequestFormValues>({
    resolver: zodResolver(listingRequestSchema),
    defaultValues: {
      categoryIds: [],
      businessHours: {
        mon: { ...DEFAULT_HOURS_ENTRY },
        tue: { ...DEFAULT_HOURS_ENTRY },
        wed: { ...DEFAULT_HOURS_ENTRY },
        thu: { ...DEFAULT_HOURS_ENTRY },
        fri: { ...DEFAULT_HOURS_ENTRY },
        sat: { ...DEFAULT_HOURS_ENTRY },
        sun: { ...DEFAULT_HOURS_ENTRY },
      },
    },
  })

  const selectedCategories  = watch('categoryIds')
  const watchedPrefectureId = watch('prefectureId')
  const watchedBusinessHours = useWatch({ control, name: 'businessHours' })
  const citiesForPrefecture = masterData?.cities.filter((c) => c.prefectureId === watchedPrefectureId) ?? []

  const toggleCategory = (id: number) => {
    const current = selectedCategories ?? []
    setValue(
      'categoryIds',
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
      { shouldValidate: true },
    )
  }

  if (submitted) {
    return <SubmittedScreen onBack={() => navigate('/')} />
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            APPLY
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="flex items-end justify-between pb-6">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
              >
                <ChevronLeft className="h-3 w-3" />
                Back
              </button>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                — MYPAGE
              </p>
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                店舗掲載申請
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-column layout ─────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">

            {/* ── Sidebar ──────────────────────────── */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <Store className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    掲載申請について
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  フクナビに掲載したい店舗を申請してください。<br />
                  フクナビ運営が確認後、掲載いたします。
                </p>
                {OWNER_FEATURE_ENABLED && (
                  <div className="mt-4 rounded-sm border border-border bg-muted/30 px-3 py-3">
                    <p className="text-[10px] leading-relaxed text-muted-foreground/60">
                      店舗のオーナー・スタッフの方は
                      <Link
                        to="/owner-application/new"
                        className="mx-0.5 font-bold text-primary underline-offset-2 hover:underline"
                      >
                        オーナー申請
                      </Link>
                      からご申請ください。ダッシュボードから店舗情報を管理できます。
                    </p>
                  </div>
                )}
              </div>

              <div>
                <span className="mb-4 block font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  申請の流れ
                </span>
                <div className="space-y-0">
                  {PROCESS_STEPS.map((step, i) => (
                    <div key={step.num} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-white">
                          <span className="font-headline text-[9px] font-black tabular-nums">{step.num}</span>
                        </div>
                        {i < PROCESS_STEPS.length - 1 && (
                          <div className="my-1 w-px flex-1 bg-border" style={{ minHeight: '20px' }} />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className="font-headline text-[11px] font-black tracking-tight text-foreground/70">
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/50">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── Form ─────────────────────────────── */}
            <div>
              {error && (
                <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-12">

                {/* 01 基本情報 */}
                <section className="wish-card-enter" style={{ animationDelay: '0ms' }}>
                  <SectionLabel num="01" title="基本情報" required />
                  <div className="space-y-4">
                    <Field label="店舗名" error={errors.shopName?.message}>
                      <input
                        type="text"
                        placeholder="例: ○○古着店"
                        className={cn(inputClass, errors.shopName && 'border-red-400')}
                        {...register('shopName')}
                      />
                    </Field>
                    <Field label="店舗説明" optional>
                      <textarea
                        rows={4}
                        placeholder="店舗の特徴、取り扱いブランド、雰囲気など…"
                        className={cn(
                          'w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm leading-relaxed',
                          'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
                          'resize-none',
                        )}
                        {...register('description')}
                      />
                    </Field>
                  </div>
                </section>

                {/* 02 住所 */}
                <section className="wish-card-enter" style={{ animationDelay: '40ms' }}>
                  <SectionLabel num="02" title="住所" required />
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="都道府県" error={errors.prefectureId?.message}>
                        <select
                          className={cn(selectClass, errors.prefectureId && 'border-red-400')}
                          {...register('prefectureId', { valueAsNumber: true })}
                        >
                          <option value="">選択してください</option>
                          {masterData?.prefectures.map((pref) => (
                            <option key={pref.id} value={pref.id}>{pref.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="市区町村" optional>
                        <select
                          className={selectClass}
                          disabled={!watchedPrefectureId || citiesForPrefecture.length === 0}
                          {...register('cityId', { valueAsNumber: true })}
                        >
                          <option value="">選択してください</option>
                          {citiesForPrefecture.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="町名・番地・建物名" optional>
                      <input
                        type="text"
                        placeholder="例: 道玄坂1-1-1 ○○ビル2F"
                        className={inputClass}
                        {...register('address')}
                      />
                    </Field>
                  </div>
                </section>

                {/* 03 価格帯 */}
                <section className="wish-card-enter" style={{ animationDelay: '60ms' }}>
                  <SectionLabel num="03" title="価格帯" optional />
                  <div className="sm:w-1/2">
                    <Field label="価格帯" optional>
                      <select
                        className={selectClass}
                        {...register('priceRangeId', { valueAsNumber: true })}
                      >
                        <option value="">指定なし</option>
                        {masterData?.priceRanges.map((pr) => (
                          <option key={pr.id} value={pr.id}>{pr.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </section>

                {/* 04 カテゴリ */}
                <section className="wish-card-enter" style={{ animationDelay: '80ms' }}>
                  <SectionLabel num="04" title="カテゴリ" required />
                  <div className="flex flex-wrap gap-2">
                    {masterData?.categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          'rounded-sm border px-3 py-2 text-[11px] font-bold transition-all',
                          selectedCategories?.includes(cat.id)
                            ? 'border-primary bg-primary text-white'
                            : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  {errors.categoryIds && (
                    <p className="mt-2 text-[10px] font-medium text-red-500">{errors.categoryIds.message}</p>
                  )}
                </section>

                {/* 05 写真 */}
                <section className="wish-card-enter space-y-4" style={{ animationDelay: '100ms' }}>
                  <SectionLabel num="05" title="写真" optional />

                  <ShopPhotoUploadInput
                    onChange={handleFileSelect}
                    disabled={uploadingPhotos}
                    uploading={uploadingPhotos}
                  />

                  {photoError && (
                    <p className="text-[10px] font-medium text-red-500">{photoError}</p>
                  )}

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {previewUrls.map((url, i) => (
                        <div key={url} className="group relative aspect-square overflow-hidden bg-muted">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className={cn(
                              'absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full',
                              'bg-foreground/70 text-white opacity-0 transition-opacity group-hover:opacity-100',
                            )}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 rounded-sm bg-primary/80 px-1 py-0.5 font-headline text-[8px] font-black uppercase tracking-wider text-white">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground/40">
                    JPEG / PNG / WebP · 最大10枚
                  </p>
                </section>

                {/* 06 連絡先 */}
                <section className="wish-card-enter" style={{ animationDelay: '120ms' }}>
                  <SectionLabel num="06" title="連絡先" icon={<Phone className="h-3.5 w-3.5" />} optional />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="電話番号" optional>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                        <input
                          type="tel"
                          placeholder="03-0000-0000"
                          className={cn(inputClass, 'pl-9')}
                          {...register('phone')}
                        />
                      </div>
                    </Field>
                    <Field label="公式サイト" optional error={errors.websiteUrl?.message}>
                      <div className="relative">
                        <Globe className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                        <input
                          type="url"
                          placeholder="https://example.com"
                          className={cn(inputClass, 'pl-9', errors.websiteUrl && 'border-red-400')}
                          {...register('websiteUrl')}
                        />
                      </div>
                    </Field>
                  </div>
                </section>

                {/* 07 SNS */}
                <section className="wish-card-enter" style={{ animationDelay: '160ms' }}>
                  <SectionLabel num="07" title="SNS" optional />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Instagram" optional error={errors.instagramUrl?.message}>
                      <div className="relative">
                        <Instagram className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                        <input
                          type="url"
                          placeholder="https://instagram.com/..."
                          className={cn(inputClass, 'pl-9', errors.instagramUrl && 'border-red-400')}
                          {...register('instagramUrl')}
                        />
                      </div>
                    </Field>
                    <Field label="X" optional error={errors.twitterUrl?.message}>
                      <div className="relative">
                        <XLogo className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                        <input
                          type="url"
                          placeholder="https://x.com/..."
                          className={cn(inputClass, 'pl-9', errors.twitterUrl && 'border-red-400')}
                          {...register('twitterUrl')}
                        />
                      </div>
                    </Field>
                    <Field label="TikTok" optional error={errors.tiktokUrl?.message}>
                      <div className="relative">
                        <TikTokLogo className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                        <input
                          type="url"
                          placeholder="https://tiktok.com/@..."
                          className={cn(inputClass, 'pl-9', errors.tiktokUrl && 'border-red-400')}
                          {...register('tiktokUrl')}
                        />
                      </div>
                    </Field>
                  </div>
                </section>

                {/* 08 営業時間 */}
                <ShopBusinessHoursSection
                  num="08"
                  businessHours={watchedBusinessHours}
                  register={register}
                  onToggle={(dayKey: DayKey) =>
                    setValue(
                      `businessHours.${dayKey}.enabled` as Path<ListingRequestFormValues>,
                      !(watchedBusinessHours?.[dayKey]?.enabled ?? false),
                      { shouldDirty: true },
                    )
                  }
                  animationDelay="180ms"
                />

                {/* 09 補足メモ */}
                <section className="wish-card-enter" style={{ animationDelay: '200ms' }}>
                  <SectionLabel num="09" title="補足メモ" optional />
                  <Field label="フクナビ運営への補足" optional>
                    <textarea
                      rows={3}
                      placeholder="フクナビ運営への補足情報など…"
                      className={cn(
                        'w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm leading-relaxed',
                        'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
                        'resize-none',
                      )}
                      {...register('note')}
                    />
                  </Field>
                </section>

                {/* Submit */}
                <div className="border-t border-border pt-8">
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isPending}
                      className={cn(
                        'bg-primary px-8 py-3 text-xs font-black uppercase tracking-[0.3em] text-white transition-opacity',
                        'hover:opacity-90 disabled:opacity-40',
                      )}
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          送信中...
                        </span>
                      ) : (
                        '申請する'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>

              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingRequestPage
