import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Globe, Instagram, Twitter, Phone, ExternalLink, CheckCircle2, ImagePlus, X, Tag } from 'lucide-react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/hooks/useShop'
import { cn } from '@/lib/utils'
import type { Area, Category, PriceRange } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const BUCKET = 'shop-photos'
const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`

interface PhotoRow {
  id: string
  storagePath: string
  order: number
}

const useShopPhotos = (shopId: string) =>
  useQuery({
    queryKey: ['shop-photos', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_photos')
        .select('id, storage_path, order')
        .eq('shop_id', shopId)
        .order('order', { ascending: true }) as unknown as { data: { id: string; storage_path: string; order: number }[] | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      return (data ?? []).map((p): PhotoRow => ({ id: p.id, storagePath: p.storage_path, order: p.order }))
    },
    enabled: !!shopId,
  })

const shopEditSchema = z.object({
  name: z.string().min(1, '店舗名を入力してください').max(100),
  description: z.string().max(2000).optional(),
  areaId: z.number({ required_error: 'エリアを選択してください' }),
  priceRangeId: z.number().optional(),
  categoryIds: z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  phone: z.string().max(20).optional(),
  websiteUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  instagramUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  status: z.enum(['public', 'private', 'pending']),
})

type ShopEditFormValues = z.infer<typeof shopEditSchema>

const STATUS_OPTIONS: { value: ShopEditFormValues['status']; label: string; sublabel: string; badgeClass: string }[] = [
  { value: 'public', label: '公開', sublabel: '一般公開中', badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'pending', label: '審査中', sublabel: '審査待ち状態', badgeClass: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'private', label: '非公開', sublabel: '非公開で保存', badgeClass: 'border-border bg-muted text-muted-foreground' },
]

interface SectionLabelProps {
  num: string
  title: string
  required?: boolean
  optional?: boolean
}

const SectionLabel = ({ num, title, required, optional }: SectionLabelProps) => (
  <div className="mb-4 flex items-baseline gap-3">
    <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">{num}</span>
    <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">{title}</span>
    {required && <span className="text-[10px] font-bold text-primary">REQUIRED</span>}
    {optional && <span className="text-[10px] font-medium text-muted-foreground/40">optional</span>}
  </div>
)

const inputClass = cn(
  'h-10 w-full rounded-sm border border-border bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
)

const selectClass = cn(
  'h-10 w-full rounded-sm border border-border bg-white px-3 text-sm text-foreground',
  'focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none',
)

const inputWithIconClass = cn(
  'h-10 w-full rounded-sm border border-border bg-white pl-9 pr-3 text-sm text-foreground',
  'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
)

const useMasterData = () =>
  useQuery({
    queryKey: ['master-data'],
    queryFn: async () => {
      const [areas, categories, priceRanges] = await Promise.all([
        supabase.from('areas').select('id, prefecture, city, slug').order('id') as unknown as Promise<{ data: Area[] | null; error: unknown }>,
        supabase.from('categories').select('id, code, name').order('id') as unknown as Promise<{ data: Category[] | null; error: unknown }>,
        supabase.from('price_ranges').select('id, label, min_price, max_price').order('id') as unknown as Promise<{ data: ({ id: number; label: string; min_price: number | null; max_price: number | null })[] | null; error: unknown }>,
      ])
      return {
        areas: areas.data ?? [],
        categories: categories.data ?? [],
        priceRanges: (priceRanges.data ?? []).map((p) => ({
          id: p.id,
          label: p.label,
          minPrice: p.min_price,
          maxPrice: p.max_price,
        })) as PriceRange[],
      }
    },
    staleTime: Infinity,
  })

const useAdminUpdateShop = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ shopId, categoryIds, ...fields }: ShopEditFormValues & { shopId: string }) => {
      const { error: shopError } = await supabase
        .from('shops')
        .update({
          name: fields.name,
          description: fields.description || null,
          area_id: fields.areaId,
          price_range_id: fields.priceRangeId ?? null,
          phone: fields.phone || null,
          website_url: fields.websiteUrl || null,
          instagram_url: fields.instagramUrl || null,
          twitter_url: fields.twitterUrl || null,
          status: fields.status,
        } as never)
        .eq('id', shopId) as unknown as { error: { message: string } | null }

      if (shopError) throw new Error(shopError.message)

      const { error: delError } = await supabase
        .from('shop_categories')
        .delete()
        .eq('shop_id', shopId) as unknown as { error: { message: string } | null }

      if (delError) throw new Error(delError.message)

      const { error: insError } = await supabase
        .from('shop_categories')
        .insert(categoryIds.map((id) => ({ shop_id: shopId, category_id: id })) as never) as unknown as { error: { message: string } | null }

      if (insError) throw new Error(insError.message)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      queryClient.invalidateQueries({ queryKey: ['shop', variables.shopId] })
    },
  })
}

const AdminShopEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const { data: photos = [] } = useShopPhotos(id ?? '')

  const { mutate: deletePhoto, isPending: isDeleting } = useMutation({
    mutationFn: async ({ photoId, storagePath }: { photoId: string; storagePath: string }) => {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
      if (storageError) throw new Error(storageError.message)
      const { error: dbError } = await supabase
        .from('shop_photos')
        .delete()
        .eq('id', photoId) as unknown as { error: { message: string } | null }
      if (dbError) throw new Error(dbError.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-photos', id] })
      queryClient.invalidateQueries({ queryKey: ['shop', id] })
    },
  })

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0 || !id) return
    setUploading(true)
    setPhotoError(null)
    try {
      const maxOrder = photos.length > 0 ? Math.max(...photos.map((p) => p.order)) : -1
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${id}/${crypto.randomUUID()}.${ext}`
        const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file)
        if (storageErr) throw new Error(storageErr.message)
        const { error: dbErr } = await supabase
          .from('shop_photos')
          .insert({ shop_id: id, storage_path: path, order: maxOrder + 1 + i } as never) as unknown as { error: { message: string } | null }
        if (dbErr) {
          await supabase.storage.from(BUCKET).remove([path])
          throw new Error(dbErr.message)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['shop-photos', id] })
      queryClient.invalidateQueries({ queryKey: ['shop', id] })
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const { data: shop, isLoading: shopLoading } = useShop(id ?? '')
  const { data: masterData } = useMasterData()
  const { mutate, isPending, error } = useAdminUpdateShop()

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm<ShopEditFormValues>({

    resolver: zodResolver(shopEditSchema),
    defaultValues: { categoryIds: [], status: 'public' },
  })

  const selectedCategories = watch('categoryIds')
  const watchedStatus = watch('status')

  useEffect(() => {
    if (!shop) return
    reset({
      name: shop.name,
      description: shop.description ?? '',
      areaId: shop.area?.id,
      priceRangeId: shop.priceRange?.id,
      categoryIds: shop.categories.map((c) => c.id),
      phone: shop.phone ?? '',
      websiteUrl: shop.websiteUrl ?? '',
      instagramUrl: shop.instagramUrl ?? '',
      twitterUrl: shop.twitterUrl ?? '',
      status: shop.status,
    })
  }, [shop, reset])

  const toggleCategory = (catId: number) => {
    const current = selectedCategories ?? []
    setValue(
      'categoryIds',
      current.includes(catId) ? current.filter((c) => c !== catId) : [...current, catId],
      { shouldValidate: true },
    )
  }

  const onSubmit = (values: ShopEditFormValues) => {
    if (!id) return
    mutate(
      { ...values, shopId: id },
      {
        onSuccess: () => {
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 4000)
        },
      },
    )
  }

  if (shopLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="font-headline text-2xl font-black tracking-tight text-muted-foreground">SHOP NOT FOUND</p>
        <button
          onClick={() => navigate('/admin/shops')}
          className="text-xs font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline"
        >
          ← 店舗管理に戻る
        </button>
      </div>
    )
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
            EDIT
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
              Shop Management
            </button>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — Admin
            </p>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                  EDIT SHOP
                </h1>
                <p className="mt-2 truncate text-sm font-medium text-white/50">{shop.name}</p>
              </div>
              <a
                href={`/shops/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white/70"
              >
                <ExternalLink className="h-3 w-3" />
                店舗ページ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-16 md:py-14">

          {/* Success banner */}
          {showSuccess && (
            <div className="wish-card-enter mb-8 flex items-center gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-700">変更を保存しました</p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">

            {/* ── 01 BASIC INFO ────────────────────── */}
            <section>
              <SectionLabel num="01" title="BASIC INFO" required />
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    店舗名
                  </label>
                  <input
                    type="text"
                    placeholder="例: ○○古着店"
                    className={cn(inputClass, errors.name && 'border-red-400')}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    店舗説明
                    <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/40">optional</span>
                  </label>
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
                </div>
              </div>
            </section>

            {/* ── 02 LOCATION ──────────────────────── */}
            <section>
              <SectionLabel num="02" title="LOCATION" required />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    エリア
                  </label>
                  <select
                    className={cn(selectClass, errors.areaId && 'border-red-400')}
                    {...register('areaId', { valueAsNumber: true })}
                  >
                    <option value="">選択してください</option>
                    {masterData?.areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.city}</option>
                    ))}
                  </select>
                  {errors.areaId && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors.areaId.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    価格帯
                    <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/40">optional</span>
                  </label>
                  <select
                    className={selectClass}
                    {...register('priceRangeId', { valueAsNumber: true })}
                  >
                    <option value="">指定なし</option>
                    {masterData?.priceRanges.map((pr) => (
                      <option key={pr.id} value={pr.id}>{pr.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ── 03 CATEGORY ──────────────────────── */}
            <section>
              <SectionLabel num="03" title="CATEGORY" required />
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

            {/* ── 04 CONTACT ───────────────────────── */}
            <section>
              <SectionLabel num="04" title="CONTACT" optional />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    電話番号
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                    <input
                      type="tel"
                      placeholder="03-0000-0000"
                      className={inputWithIconClass}
                      {...register('phone')}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    公式サイト
                  </label>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className={cn(inputWithIconClass, errors.websiteUrl && 'border-red-400')}
                      {...register('websiteUrl')}
                    />
                  </div>
                  {errors.websiteUrl && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors.websiteUrl.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── 05 SOCIAL ────────────────────────── */}
            <section>
              <SectionLabel num="05" title="SOCIAL" optional />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    Instagram
                  </label>
                  <div className="relative">
                    <Instagram className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                    <input
                      type="url"
                      placeholder="https://instagram.com/..."
                      className={cn(inputWithIconClass, errors.instagramUrl && 'border-red-400')}
                      {...register('instagramUrl')}
                    />
                  </div>
                  {errors.instagramUrl && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors.instagramUrl.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    X
                  </label>
                  <div className="relative">
                    <Twitter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                    <input
                      type="url"
                      placeholder="https://x.com/..."
                      className={cn(inputWithIconClass, errors.twitterUrl && 'border-red-400')}
                      {...register('twitterUrl')}
                    />
                  </div>
                  {errors.twitterUrl && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">{errors.twitterUrl.message}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── 06 STATUS ────────────────────────── */}
            <section>
              <SectionLabel num="06" title="STATUS" />
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

            {/* ── 07 PHOTOS ────────────────────────── */}
            <section className="space-y-4">
              <SectionLabel num="07" title="PHOTOS" optional />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={handlePhotoFileChange}
              />

              {/* Upload trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isDeleting}
                className={cn(
                  'flex w-full items-center justify-center gap-2 border border-dashed border-border py-8',
                  'text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50',
                  'transition-colors hover:border-primary/40 hover:text-primary/60 disabled:opacity-40',
                )}
              >
                <ImagePlus className="h-4 w-4" />
                {uploading ? 'アップロード中...' : '写真を追加'}
              </button>

              {/* Error */}
              {photoError && (
                <p className="text-[10px] font-medium text-red-500">{photoError}</p>
              )}

              {/* Photo grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((photo, i) => (
                    <div key={photo.id} className="group relative aspect-square overflow-hidden bg-muted">
                      <img src={getPhotoUrl(photo.storagePath)} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => deletePhoto({ photoId: photo.id, storagePath: photo.storagePath })}
                        disabled={uploading || isDeleting}
                        className={cn(
                          'absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full',
                          'bg-foreground/70 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40',
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

            {/* ── Brand Management ─────────────────── */}
            <div className="border-t border-border pt-8">
              <Link
                to={`/admin/shops/${id}/brands`}
                className={cn(
                  'flex w-full items-center gap-3 border border-border bg-white px-4 py-3.5 transition-colors',
                  'hover:border-primary/20 hover:bg-primary/[0.02] editorial-shadow',
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-foreground/80">
                    ブランド管理
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/50">この店舗に紐付くブランドを編集する</p>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground/20" />
              </Link>
            </div>

            {/* ── Submit ───────────────────────────── */}
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
                      SAVING...
                    </span>
                  ) : (
                    'SAVE CHANGES'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/shops')}
                  className="px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>

          </form>

        </div>
      </div>
    </div>
  )
}

export default AdminShopEditPage
