import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useForm, Controller, useWatch, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Globe, Instagram, Twitter, Phone, ExternalLink, Tag, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/hooks/useShop'
import { useShopMasterData } from '@/hooks/useShopMasterData'
import { useUiStore } from '@/store/uiStore'
import { SectionLabel, Field, inputClass, selectClass } from '@/components/shop/ShopFormUI'
import { ShopPhotoSection } from '@/components/shop/ShopPhotoSection'
import {
  ShopBusinessHoursSection,
  businessHoursSchema,
  toFormEntry,
  toBusinessHours,
  DAYS,
  type DayKey,
} from '@/components/shop/ShopBusinessHoursSection'
import { cn } from '@/lib/utils'
import type { PriceRange, BusinessHours } from '@/types'

// ── Schema ────────────────────────────────────────────────────────

const shopEditSchema = z.object({
  name:         z.string().min(1, '店舗名を入力してください').max(100),
  description:  z.string().max(2000).optional(),
  prefectureId: z.number({ required_error: '都道府県を選択してください' }),
  priceRangeId: z.number().optional(),
  categoryIds:  z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  phone:        z.string().max(20).optional(),
  websiteUrl:   z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  instagramUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl:   z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  status:       z.enum(['public', 'private', 'pending']),
  businessHours: businessHoursSchema,
})

type ShopEditFormValues = z.infer<typeof shopEditSchema>

// ── Status options ────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: ShopEditFormValues['status']
  label: string
  sublabel: string
  badgeClass: string
}[] = [
  { value: 'public',  label: '公開',  sublabel: '一般公開中',  badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'pending', label: '審査中', sublabel: '審査待ち状態', badgeClass: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'private', label: '非公開', sublabel: '非公開で保存', badgeClass: 'border-border bg-muted text-muted-foreground' },
]

// ── Helper ────────────────────────────────────────────────────────

function shopToFormValues(shop: {
  name: string
  description: string | null
  prefectureId: number | null
  priceRange: PriceRange | null
  categories: { id: number }[]
  phone: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  status: ShopEditFormValues['status']
  businessHours: BusinessHours | null
}): ShopEditFormValues {
  const bh = shop.businessHours
  return {
    name:         shop.name,
    description:  shop.description ?? '',
    prefectureId: shop.prefectureId ?? ('' as unknown as number),
    priceRangeId: shop.priceRange?.id,
    categoryIds:  shop.categories.map((c) => c.id),
    phone:        shop.phone ?? '',
    websiteUrl:   shop.websiteUrl ?? '',
    instagramUrl: shop.instagramUrl ?? '',
    twitterUrl:   shop.twitterUrl ?? '',
    status:       shop.status,
    businessHours: {
      mon: toFormEntry(bh?.mon ?? null),
      tue: toFormEntry(bh?.tue ?? null),
      wed: toFormEntry(bh?.wed ?? null),
      thu: toFormEntry(bh?.thu ?? null),
      fri: toFormEntry(bh?.fri ?? null),
      sat: toFormEntry(bh?.sat ?? null),
      sun: toFormEntry(bh?.sun ?? null),
    },
  }
}

// ── Mutation ─────────────────────────────────────────────────────

const useAdminUpdateShop = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      shopId,
      categoryIds,
      businessHours,
      ...fields
    }: ShopEditFormValues & { shopId: string }) => {
      const closedDays = DAYS
        .filter((d) => !businessHours[d.key].enabled)
        .map((d) => d.key)

      const { error: shopError } = await supabase
        .from('shops')
        .update({
          name:           fields.name,
          description:    fields.description || null,
          prefecture_id:  fields.prefectureId,
          price_range_id: fields.priceRangeId ?? null,
          phone:          fields.phone || null,
          website_url:    fields.websiteUrl || null,
          instagram_url:  fields.instagramUrl || null,
          twitter_url:    fields.twitterUrl || null,
          status:         fields.status,
          business_hours: toBusinessHours(businessHours),
          closed_days:    closedDays,
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
        .insert(categoryIds.map((id) => ({ shop_id: shopId, category_id: id })) as never) as unknown as {
          error: { message: string } | null
        }

      if (insError) throw new Error(insError.message)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      queryClient.invalidateQueries({ queryKey: ['shop', variables.shopId] })
    },
  })
}

// ── Page ─────────────────────────────────────────────────────────

const AdminShopEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useUiStore()

  const { data: shop, isLoading: shopLoading } = useShop(id ?? '')
  const { data: masterData } = useShopMasterData()
  const { mutate, isPending, error } = useAdminUpdateShop()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ShopEditFormValues>({
    resolver: zodResolver(shopEditSchema),
    defaultValues: { categoryIds: [], status: 'public' },
  })

  const businessHours      = useWatch({ control, name: 'businessHours' })
  const selectedCategories = watch('categoryIds')
  const watchedStatus      = watch('status')

  useEffect(() => {
    if (!shop) return
    reset(shopToFormValues(shop))
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
          addToast({ title: '変更を保存しました', variant: 'default', position: 'bottom-right' })
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
      {/* ── Page header */}
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
              店舗管理
            </button>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Admin</p>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                  店舗編集
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

      {/* ── Form */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14">

          {error && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_220px] lg:gap-14">
            <div className="space-y-12">

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

            {/* 02 都道府県・価格帯 */}
            <section className="wish-card-enter" style={{ animationDelay: '40ms' }}>
              <SectionLabel num="02" title="都道府県 / 価格帯" required />
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

            {/* 03 カテゴリ */}
            <section className="wish-card-enter" style={{ animationDelay: '80ms' }}>
              <SectionLabel num="03" title="カテゴリ" required />
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

            {/* 04 写真 */}
            {id && <ShopPhotoSection shopId={id} num="04" animationDelay="100ms" />}

            {/* 05 連絡先 */}
            <section className="wish-card-enter" style={{ animationDelay: '120ms' }}>
              <SectionLabel num="05" title="連絡先" icon={<Phone className="h-3.5 w-3.5" />} optional />
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

            {/* 06 SNS */}
            <section className="wish-card-enter" style={{ animationDelay: '160ms' }}>
              <SectionLabel num="06" title="SNS" optional />
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
                    <Twitter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
                    <input
                      type="url"
                      placeholder="https://x.com/..."
                      className={cn(inputClass, 'pl-9', errors.twitterUrl && 'border-red-400')}
                      {...register('twitterUrl')}
                    />
                  </div>
                </Field>
              </div>
            </section>

            {/* 07 ステータス */}
            <section className="wish-card-enter" style={{ animationDelay: '180ms' }}>
              <SectionLabel num="07" title="ステータス" />
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

            {/* 08 営業時間 */}
            <ShopBusinessHoursSection
              num="08"
              businessHours={businessHours}
              register={register}
              onToggle={(dayKey: DayKey) =>
                setValue(
                  `businessHours.${dayKey}.enabled` as Path<ShopEditFormValues>,
                  !(businessHours?.[dayKey]?.enabled ?? false),
                  { shouldDirty: true },
                )
              }
              animationDelay="200ms"
            />

            </div>{/* end main form */}

            {/* ── Sidebar */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="space-y-4">

                {/* Save status card */}
                <div className="border border-border bg-white px-4 py-3 editorial-shadow">
                  <p className="mb-2 font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    Status
                  </p>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isDirty ? 'animate-pulse bg-amber-400' : 'bg-emerald-400',
                    )} />
                    <span className="text-[10px] text-muted-foreground/60">
                      {isDirty ? '未保存の変更があります' : '最新の状態です'}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={isPending || !isDirty}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 bg-primary',
                      'font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white',
                      'py-3 transition-opacity hover:opacity-90 disabled:opacity-40',
                    )}
                  >
                    {isPending ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        保存中…
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        変更を保存
                      </>
                    )}
                  </button>
                </div>

                {/* Quick links */}
                <div className="border border-border bg-white editorial-shadow">
                  <Link
                    to={`/admin/shops/${id}/brands`}
                    className="flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-muted/30"
                  >
                    <Tag className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                      ブランド管理
                    </span>
                  </Link>
                  <a
                    href={`/shops/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                  >
                    <Globe className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                      公開ページ
                    </span>
                  </a>
                </div>

              </div>
            </aside>

          </div>{/* end grid */}

          {/* Mobile submit */}
          <div className="mt-12 border-t border-border pt-8 lg:hidden">
            <button
              type="submit"
              disabled={isPending || !isDirty}
              className={cn(
                'flex items-center gap-2 bg-primary px-6 py-2.5',
                'font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white',
                'transition-opacity hover:opacity-90 disabled:opacity-40',
              )}
            >
              {isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  保存中…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  変更を保存
                </>
              )}
            </button>
          </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminShopEditPage
