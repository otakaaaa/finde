import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Globe, Instagram, Phone, X } from 'lucide-react'
import { XLogo } from '@/components/icons/XLogo'
import { TikTokLogo } from '@/components/icons/TikTokLogo'
import { supabase } from '@/lib/supabase'
import { validateAllowedImageFiles } from '@/lib/fileValidation'
import { ShopPhotoUploadInput } from '@/components/shop/ShopPhotoUploadInput'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useShopMasterData } from '@/hooks/useShopMasterData'
import { SectionLabel, Field, inputClass, selectClass } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'

const BUCKET = 'shop-photos'

const shopSchema = z.object({
  name:         z.string().min(1, '店舗名を入力してください').max(100),
  description:  z.string().max(2000).optional(),
  prefectureId: z.number({ required_error: '都道府県を選択してください', invalid_type_error: '都道府県を選択してください' }),
  cityId:       z.number().optional(),
  address:      z.string().max(200).optional(),
  priceRangeId: z.number().optional(),
  categoryIds:  z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  phone:        z.string().max(20).optional(),
  websiteUrl:   z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  instagramUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl:   z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  tiktokUrl:    z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  status:       z.enum(['public', 'private', 'pending']),
})

type ShopFormValues = z.infer<typeof shopSchema>

const STATUS_OPTIONS: {
  value: ShopFormValues['status']
  label: string
  sublabel: string
  badgeClass: string
}[] = [
  { value: 'public',  label: '公開',  sublabel: '即時公開する',        badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'pending', label: '審査中', sublabel: '審査待ちとして登録',   badgeClass: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'private', label: '非公開', sublabel: '非公開で下書き保存',   badgeClass: 'border-border bg-muted text-muted-foreground' },
]

const AdminShopNewPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { addToast } = useUiStore()
  const { data: masterData } = useShopMasterData()

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
    mutationFn: async (values: ShopFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          name:           values.name,
          description:    values.description || null,
          prefecture_id:  values.prefectureId,
          city_id:        values.cityId ?? null,
          address:        values.address || null,
          price_range_id: values.priceRangeId ?? null,
          phone:          values.phone || null,
          website_url:    values.websiteUrl || null,
          instagram_url:  values.instagramUrl || null,
          twitter_url:    values.twitterUrl || null,
          tiktok_url:     values.tiktokUrl || null,
          status:         values.status,
          created_by:     user.id,
        } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (shopError) throw new Error(shopError.message)
      if (!shop) throw new Error('店舗の作成に失敗しました')

      const { error: catError } = await supabase
        .from('shop_categories')
        .insert(values.categoryIds.map((categoryId) => ({ shop_id: shop.id, category_id: categoryId })) as never) as unknown as {
          error: { message: string } | null
        }

      if (catError) throw new Error(catError.message)

      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i]
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${shop.id}/${crypto.randomUUID()}.${ext}`
        const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file)
        if (storageErr) throw new Error(storageErr.message)
        const { error: photoErr } = await supabase
          .from('shop_photos')
          .insert({ shop_id: shop.id, storage_path: path, order: i } as never) as unknown as {
            error: { message: string } | null
          }
        if (photoErr) {
          await supabase.storage.from(BUCKET).remove([path])
          throw new Error(photoErr.message)
        }
      }

      return shop.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      addToast({ title: '店舗を登録しました', variant: 'default', position: 'bottom-right' })
      navigate('/admin/shops')
    },
  })

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: { categoryIds: [], status: 'public' },
  })

  const selectedCategories  = watch('categoryIds')
  const watchedStatus       = watch('status')
  const watchedPrefectureId = watch('prefectureId')
  const citiesForPrefecture = masterData?.cities.filter((c) => c.prefectureId === watchedPrefectureId) ?? []

  const toggleCategory = (id: number) => {
    const current = selectedCategories ?? []
    setValue(
      'categoryIds',
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
      { shouldValidate: true },
    )
  }

  return (
    <div>
      {/* ── Page header */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            CREATE
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <button
              type="button"
              onClick={() => navigate('/admin/shops')}
              className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              店舗管理
            </button>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Admin</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              店舗新規登録
            </h1>
          </div>
        </div>
      </section>

      {/* ── Form */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-16 md:py-14">

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
                <Field label="店舗名" error={errors.name?.message}>
                  <input
                    type="text"
                    placeholder="例: ○○古着店"
                    className={cn(inputClass, errors.name && 'border-red-400')}
                    {...register('name')}
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

            {/* 08 ステータス */}
            <section className="wish-card-enter" style={{ animationDelay: '180ms' }}>
              <SectionLabel num="08" title="ステータス" />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          'flex flex-col items-start rounded-sm border-2 bg-white p-3.5 text-left transition-all duration-150',
                          watchedStatus === opt.value
                            ? opt.badgeClass + ' border-current'
                            : 'border-border hover:border-primary/30',
                        )}
                      >
                        <span className={cn(
                          'mb-1 font-headline text-[11px] font-black uppercase tracking-wide',
                          watchedStatus === opt.value ? 'opacity-100' : 'text-foreground/70',
                        )}>
                          {opt.label}
                        </span>
                        <span className={cn(
                          'text-[10px] leading-relaxed',
                          watchedStatus === opt.value ? 'opacity-70' : 'text-muted-foreground/50',
                        )}>
                          {opt.sublabel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              />
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
                      登録中...
                    </span>
                  ) : (
                    '登録する'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/shops')}
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
  )
}

export default AdminShopNewPage
