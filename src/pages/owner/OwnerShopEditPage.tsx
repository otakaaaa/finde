import { useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Globe, Instagram, Twitter, Phone, Save, Tag } from 'lucide-react'
import { useShop } from '@/hooks/useShop'
import { useUpdateShop } from '@/hooks/useOwnerShops'
import { useShopMasterData } from '@/hooks/useShopMasterData'
import { SectionLabel, Field, inputClass, selectClass } from '@/components/shop/ShopFormUI'
import { useUiStore } from '@/store/uiStore'
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

// ── Schema ─────────────────────────────────────────────────────

const shopEditSchema = z.object({
  name:         z.string().min(1, '店舗名を入力してください').max(100),
  description:  z.string().max(2000, '2000文字以内').optional(),
  prefectureId: z.number({ required_error: '都道府県を選択してください' }),
  priceRangeId: z.number().optional(),
  categoryIds:  z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  phone:        z.string().max(20).optional(),
  websiteUrl:   z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  instagramUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl:   z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  businessHours: businessHoursSchema,
})

type FormValues = z.infer<typeof shopEditSchema>

// ── Helper ─────────────────────────────────────────────────────

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
  businessHours: BusinessHours | null
}): FormValues {
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

// ── Page ───────────────────────────────────────────────────────

const OwnerShopEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { data: shop, isLoading } = useShop(id ?? '')
  const { mutate, isPending } = useUpdateShop()
  const { data: masterData } = useShopMasterData()
  const { addToast } = useUiStore()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(shopEditSchema),
    defaultValues: { categoryIds: [] },
  })

  const businessHours = useWatch({ control, name: 'businessHours' })
  const description = watch('description')
  const selectedCategories = watch('categoryIds')

  useEffect(() => {
    if (shop) reset(shopToFormValues(shop))
  }, [shop, reset])

  const toggleCategory = (catId: number) => {
    const current = selectedCategories ?? []
    setValue(
      'categoryIds',
      current.includes(catId) ? current.filter((c) => c !== catId) : [...current, catId],
      { shouldValidate: true, shouldDirty: true },
    )
  }

  const onSubmit = (values: FormValues) => {
    if (!id) return
    const closedDays = DAYS
      .filter((d) => !values.businessHours[d.key].enabled)
      .map((d) => d.key)

    mutate(
      {
        shopId:        id,
        name:          values.name,
        description:   values.description,
        prefectureId:  values.prefectureId,
        priceRangeId:  values.priceRangeId ?? null,
        categoryIds:   values.categoryIds,
        phone:         values.phone,
        websiteUrl:    values.websiteUrl,
        instagramUrl:  values.instagramUrl,
        twitterUrl:    values.twitterUrl,
        businessHours: toBusinessHours(values.businessHours),
        closedDays,
      },
      {
        onSuccess: () => {
          reset(values)
          addToast({ title: '変更を保存しました', variant: 'default', position: 'bottom-right' })
        },
        onError: (err) => {
          addToast({ title: (err as Error).message || '保存に失敗しました', variant: 'destructive', position: 'bottom-right' })
        },
      },
    )
  }

  // queryClient is used indirectly via useUpdateShop and ShopPhotoSection
  void queryClient

  const SaveButton = ({ full }: { full?: boolean }) => (
    <button
      type="submit"
      disabled={isPending || !isDirty}
      className={cn(
        'flex items-center gap-2 bg-primary font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity',
        'hover:opacity-90 disabled:opacity-40',
        full ? 'w-full justify-center py-3' : 'px-6 py-2.5',
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
  )

  return (
    <div className="min-h-[calc(100dvh-56px)]">

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
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/owner"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" /> ダッシュボード
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Owner</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              {isLoading
                ? <span className="inline-block h-8 w-48 animate-pulse rounded-sm bg-white/10" />
                : (shop?.name ?? 'SHOP EDIT')
              }
            </h1>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="flex justify-center bg-background py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && shop && (
        <div className="bg-background">
          <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14">
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
                      <Field label="店舗説明" optional error={errors.description?.message}>
                        <textarea
                          rows={6}
                          placeholder="店舗の特徴やコンセプト、セレクトのこだわりなどをご紹介ください…"
                          className={cn(
                            'w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm leading-relaxed',
                            'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
                            'resize-none',
                            errors.description && 'border-red-400',
                          )}
                          {...register('description')}
                        />
                        <div className="mt-1 flex justify-end">
                          <span className="font-mono text-[9px] text-muted-foreground/30">
                            {description?.length ?? 0} / 2000
                          </span>
                        </div>
                      </Field>
                    </div>
                  </section>

                  {/* 02 エリア・価格帯 */}
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
                        <input
                          type="tel"
                          placeholder="03-0000-0000"
                          className={inputClass}
                          {...register('phone')}
                        />
                      </Field>
                      <Field label="公式サイト" optional error={errors.websiteUrl?.message}>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/35" />
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
                          <Instagram className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/35" />
                          <input
                            type="url"
                            placeholder="https://instagram.com/yourshop"
                            className={cn(inputClass, 'pl-9', errors.instagramUrl && 'border-red-400')}
                            {...register('instagramUrl')}
                          />
                        </div>
                      </Field>
                      <Field label="X" optional error={errors.twitterUrl?.message}>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/35" />
                          <input
                            type="url"
                            placeholder="https://x.com/yourshop"
                            className={cn(inputClass, 'pl-9', errors.twitterUrl && 'border-red-400')}
                            {...register('twitterUrl')}
                          />
                        </div>
                      </Field>
                    </div>
                  </section>

                  {/* 07 営業時間 */}
                  <ShopBusinessHoursSection
                    num="07"
                    businessHours={businessHours}
                    register={register}
                    onToggle={(dayKey: DayKey) =>
                      setValue(
                        `businessHours.${dayKey}.enabled` as Path<FormValues>,
                        !(businessHours?.[dayKey]?.enabled ?? false),
                        { shouldDirty: true },
                      )
                    }
                    animationDelay="200ms"
                  />

                </div>

                {/* ── Sidebar */}
                <aside className="lg:sticky lg:top-8 lg:self-start">
                  <div className="space-y-4">
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
                      <SaveButton full />
                    </div>

                    <div className="border border-border bg-white editorial-shadow">
                      <Link
                        to={`/owner/shops/${id}/brands`}
                        className="flex items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-muted/30"
                      >
                        <Tag className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                          ブランド管理
                        </span>
                      </Link>
                      <Link
                        to={`/shops/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                      >
                        <Globe className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <span className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                          公開ページ
                        </span>
                      </Link>
                    </div>
                  </div>
                </aside>

              </div>

              <div className="mt-12 border-t border-border pt-8 lg:hidden">
                <SaveButton />
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default OwnerShopEditPage
