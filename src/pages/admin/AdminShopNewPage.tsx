import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Globe, Instagram, Twitter, Phone, ImagePlus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Area, Category, PriceRange } from '@/types'

const BUCKET = 'shop-photos'

const shopSchema = z.object({
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

type ShopFormValues = z.infer<typeof shopSchema>

const STATUS_OPTIONS: { value: ShopFormValues['status']; label: string; sublabel: string; badgeClass: string }[] = [
  { value: 'public', label: '公開', sublabel: '即時公開する', badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'pending', label: '審査中', sublabel: '審査待ちとして登録', badgeClass: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'private', label: '非公開', sublabel: '非公開で下書き保存', badgeClass: 'border-border bg-muted text-muted-foreground' },
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

const AdminShopNewPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  // Generate / revoke object URLs when pendingFiles changes
  useEffect(() => {
    const urls = pendingFiles.map((f) => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [pendingFiles])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setPendingFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const { data: masterData } = useQuery({
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
        priceRanges: (priceRanges.data ?? []).map((p) => ({ id: p.id, label: p.label, minPrice: p.min_price, maxPrice: p.max_price })) as PriceRange[],
      }
    },
    staleTime: Infinity,
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (values: ShopFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          name: values.name,
          description: values.description || null,
          area_id: values.areaId,
          price_range_id: values.priceRangeId ?? null,
          phone: values.phone || null,
          website_url: values.websiteUrl || null,
          instagram_url: values.instagramUrl || null,
          twitter_url: values.twitterUrl || null,
          status: values.status,
          created_by: user.id,
        } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (shopError) throw new Error(shopError.message)
      if (!shop) throw new Error('店舗の作成に失敗しました')

      const categoryRows = values.categoryIds.map((categoryId) => ({
        shop_id: shop.id,
        category_id: categoryId,
      }))
      const { error: catError } = await supabase
        .from('shop_categories')
        .insert(categoryRows as never) as unknown as { error: { message: string } | null }

      if (catError) throw new Error(catError.message)

      // Upload pending photos
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i]
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${shop.id}/${crypto.randomUUID()}.${ext}`

        const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file)
        if (storageErr) throw new Error(storageErr.message)

        const { error: photoErr } = await supabase
          .from('shop_photos')
          .insert({ shop_id: shop.id, storage_path: path, order: i } as never) as unknown as { error: { message: string } | null }

        if (photoErr) {
          await supabase.storage.from(BUCKET).remove([path])
          throw new Error(photoErr.message)
        }
      }

      return shop.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      navigate('/admin/shops')
    },
  })

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: { categoryIds: [], status: 'public' },
  })

  const selectedCategories = watch('categoryIds')
  const watchedStatus = watch('status')

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
      {/* ── Page header ──────────────────────────── */}
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
              Shop Management
            </button>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — Admin
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              NEW SHOP
            </h1>
          </div>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-16 md:py-14">

          {error && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-12">

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
              <div className="flex items-baseline gap-3">
                <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">07</span>
                <h2 className="font-headline text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50">Photos</h2>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={handleFileSelect}
              />

              {/* Upload trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex w-full items-center justify-center gap-2 border border-dashed border-border py-8',
                  'text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50',
                  'transition-colors hover:border-primary/40 hover:text-primary/60',
                )}
              >
                <ImagePlus className="h-4 w-4" />
                写真を追加
              </button>

              {/* Preview grid */}
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
                    'REGISTER SHOP'
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

export default AdminShopNewPage
