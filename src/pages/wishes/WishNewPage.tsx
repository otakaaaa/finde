import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, X, Plus, Globe, Lock, Bell, BellOff, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCreateWish } from '@/hooks/useWishes'
import { BrandSearchInput } from '@/components/wish/BrandSearchInput'
import { cn } from '@/lib/utils'
import type { Area, PriceRange, ItemCategory, ItemType } from '@/types'

const wishSchema = z.object({
  categoryId: z.number().default(1),
  itemCategoryId: z.number().optional(),
  itemTypeId: z.number().optional(),
  priceRangeId: z.number({ required_error: '価格帯を選択してください' }),
  areaId: z.number({ required_error: 'エリアを選択してください' }),
  size: z.string().optional(),
  note: z.string().max(500, '500文字以内で入力してください').optional(),
  condition: z.enum(['new', 'used']).optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean(),
  notifyEmail: z.boolean(),
  brandId: z.string().optional(),
})

type WishFormSchema = z.infer<typeof wishSchema>

const URGENCY_OPTIONS = [
  { value: 'low'    as const, label: '低', activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  { value: 'medium' as const, label: '中', activeClass: 'bg-amber-50 border-amber-400 text-amber-700' },
  { value: 'high'   as const, label: '高', activeClass: 'bg-red-50 border-red-400 text-red-700' },
]

const SectionLabel = ({
  num,
  title,
  required,
  optional,
}: {
  num: string
  title: string
  required?: boolean
  optional?: boolean
}) => (
  <div className="mb-4 flex items-baseline gap-3">
    <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">{num}</span>
    <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">{title}</span>
    {required && (
      <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        必須
      </span>
    )}
    {optional && (
      <span className="inline-flex items-center gap-1 rounded-sm border border-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/40">
        <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/30" />
        任意
      </span>
    )}
  </div>
)

const TagInput = ({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setInput('')
  }

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag))

  return (
    <div className="min-h-[48px] w-full rounded-sm border border-border bg-white px-3 py-2 focus-within:ring-1 focus-within:ring-primary/50">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-sm bg-primary/[0.07] px-2 py-0.5 text-[11px] font-bold text-primary">
            <Tag className="h-2.5 w-2.5" />
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 text-primary/50 hover:text-primary">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag() }
            if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1))
          }}
          onBlur={addTag}
          placeholder={value.length === 0 ? 'Enterで追加（例: ニット, オーバーサイズ）' : ''}
          className="min-w-[160px] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>
    </div>
  )
}

const selectClass = cn(
  'h-10 w-full rounded-sm border border-border bg-white px-3 text-sm text-foreground',
  'focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none',
)

const WishNewPage = () => {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useCreateWish()

  const { data: masterData } = useQuery({
    queryKey: ['wish-master-data'],
    queryFn: async () => {
      const [areas, priceRanges, itemCategories] = await Promise.all([
        supabase.from('areas').select('id, prefecture, city, slug').order('id') as unknown as Promise<{ data: Area[] | null }>,
        supabase.from('price_ranges').select('id, label, min_price, max_price').order('id') as unknown as Promise<{ data: { id: number; label: string; min_price: number | null; max_price: number | null }[] | null }>,
        supabase.from('item_categories').select('id, code, name, order').order('order') as unknown as Promise<{ data: ItemCategory[] | null }>,
      ])
      return {
        areas: areas.data ?? [],
        priceRanges: (priceRanges.data ?? []).map((p) => ({ id: p.id, label: p.label, minPrice: p.min_price, maxPrice: p.max_price })) as PriceRange[],
        itemCategories: itemCategories.data ?? [],
      }
    },
    staleTime: Infinity,
  })

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<WishFormSchema>({
    resolver: zodResolver(wishSchema),
    defaultValues: {
      categoryId: 1,
      isPublic: true,
      notifyEmail: true,
      tags: [],
    },
  })

  const watchedItemCategoryId = watch('itemCategoryId')
  const watchedItemTypeId = watch('itemTypeId')
  const watchedUrgency = watch('urgency')
  const watchedCondition = watch('condition')
  const watchedIsPublic = watch('isPublic')
  const watchedNotifyEmail = watch('notifyEmail')

  const { data: itemTypes } = useQuery({
    queryKey: ['item-types', watchedItemCategoryId],
    queryFn: async () => {
      if (!watchedItemCategoryId) return []
      const { data } = await supabase
        .from('item_types')
        .select('id, item_category_id, code, name, order')
        .eq('item_category_id', watchedItemCategoryId)
        .order('order') as unknown as { data: ItemType[] | null }
      return data ?? []
    },
    enabled: !!watchedItemCategoryId,
  })

  const onSubmit = (values: WishFormSchema) => {
    mutate(
      { ...values, type: 'item' },
      { onSuccess: () => navigate('/wishes') },
    )
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            ADD
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <button
              type="button"
              onClick={() => navigate('/wishes')}
              className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              一覧へ戻る
            </button>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— WISHES</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              ウィッシュ新規登録
            </h1>
          </div>
        </div>
      </section>

      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-16 md:py-14">
          {error && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{error.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">

            {/* ── 01 アイテムカテゴリ ──────────────────── */}
            <section>
              <SectionLabel num="01" title="アイテムカテゴリ" required />
              <Controller
                name="itemCategoryId"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {(masterData?.itemCategories ?? []).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          field.onChange(cat.id)
                          setValue('itemTypeId', undefined)
                        }}
                        className={cn(
                          'relative overflow-hidden border-2 bg-white p-3 text-left transition-all duration-150 editorial-shadow',
                          watchedItemCategoryId === cat.id
                            ? 'border-primary bg-primary text-white'
                            : 'border-border hover:border-primary/30',
                        )}
                      >
                        <span className={cn(
                          'block font-headline text-[11px] font-black leading-tight tracking-tight',
                          watchedItemCategoryId === cat.id ? 'text-white' : 'text-foreground',
                        )}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        field.onChange(undefined)
                        setValue('itemTypeId', undefined)
                      }}
                      className={cn(
                        'border-2 bg-white p-3 text-left transition-all editorial-shadow',
                        watchedItemCategoryId === undefined
                          ? 'border-primary bg-primary text-white'
                          : 'border-border hover:border-primary/30',
                      )}
                    >
                      <span className={cn(
                        'block font-headline text-[11px] font-black leading-tight tracking-tight',
                        watchedItemCategoryId === undefined ? 'text-white' : 'text-muted-foreground/60',
                      )}>
                        指定なし
                      </span>
                    </button>
                  </div>
                )}
              />
            </section>

            {/* ── 02 アイテムタイプ（カテゴリ選択時のみ）── */}
            {watchedItemCategoryId && (
              <section>
                <SectionLabel num="02" title="アイテムタイプ" optional />
                <Controller
                  name="itemTypeId"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {(itemTypes ?? []).map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => field.onChange(watchedItemTypeId === type.id ? undefined : type.id)}
                          className={cn(
                            'rounded-sm border px-3 py-1.5 text-[11px] font-bold transition-all',
                            watchedItemTypeId === type.id
                              ? 'border-primary bg-primary text-white'
                              : 'border-border bg-white text-foreground/70 hover:border-primary/30',
                          )}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </section>
            )}

            {/* ── 03 ブランド ──────────────────────────── */}
            <section>
              <SectionLabel num="03" title="ブランド" optional />
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <BrandSearchInput value={field.value} onChange={field.onChange} />
                )}
              />
            </section>

            {/* ── 04 エリア & 価格帯 ───────────────────── */}
            <section>
              <SectionLabel num="04" title="エリア & 価格帯" required />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    エリア
                  </label>
                  <select
                    className={cn(selectClass, errors.areaId && 'border-red-400')}
                    {...register('areaId', { valueAsNumber: true })}
                  >
                    <option value="">選択</option>
                    {masterData?.areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.city}</option>
                    ))}
                  </select>
                  {errors.areaId && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.areaId.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    価格帯
                  </label>
                  <select
                    className={cn(selectClass, errors.priceRangeId && 'border-red-400')}
                    {...register('priceRangeId', { valueAsNumber: true })}
                  >
                    <option value="">選択</option>
                    {masterData?.priceRanges.map((pr) => (
                      <option key={pr.id} value={pr.id}>{pr.label}</option>
                    ))}
                  </select>
                  {errors.priceRangeId && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.priceRangeId.message}</p>}
                </div>
              </div>
            </section>

            {/* ── 05 コンディション & サイズ ───────────── */}
            <section>
              <SectionLabel num="05" title="コンディション & サイズ" optional />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    コンディション
                  </label>
                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-2">
                        {([undefined, 'new', 'used'] as const).map((val) => (
                          <button
                            key={String(val)}
                            type="button"
                            onClick={() => field.onChange(val)}
                            className={cn(
                              'flex-1 rounded-sm border py-2 text-[11px] font-bold transition-all',
                              watchedCondition === val
                                ? 'border-primary bg-primary text-white'
                                : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                            )}
                          >
                            {val === undefined ? '指定なし' : val === 'new' ? '新品' : '中古'}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    サイズ
                  </label>
                  <input
                    type="text"
                    placeholder="例: M, 175cm, 28inch"
                    className="h-10 w-full rounded-sm border border-border bg-white px-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    {...register('size')}
                  />
                </div>
              </div>
            </section>

            {/* ── 06 優先度 & タグ & メモ ──────────────── */}
            <section>
              <SectionLabel num="06" title="優先度 & タグ & メモ" optional />
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    優先度
                  </label>
                  <Controller
                    name="urgency"
                    control={control}
                    render={({ field }) => (
                      <div className="flex gap-2">
                        {[
                          { value: undefined, label: '指定なし', activeClass: 'border-primary bg-primary text-white' },
                          ...URGENCY_OPTIONS,
                        ].map((opt) => (
                          <button
                            key={String(opt.value)}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={cn(
                              'flex-1 rounded-sm border py-2 text-[11px] font-bold transition-all',
                              watchedUrgency === opt.value
                                ? (opt.activeClass ?? 'border-primary bg-primary text-white')
                                : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    <Plus className="h-3 w-3" />
                    タグ
                  </label>
                  <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                      <TagInput value={field.value ?? []} onChange={field.onChange} />
                    )}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                    メモ
                  </label>
                  <textarea
                    rows={3}
                    placeholder="素材・年代・カラーなど、こだわり条件を書いてください"
                    className={cn(
                      'w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm leading-relaxed resize-none',
                      'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
                    )}
                    {...register('note')}
                  />
                  {errors.note && <p className="mt-1 text-[10px] font-medium text-red-500">{errors.note.message}</p>}
                </div>
              </div>
            </section>

            {/* ── 07 オプション ───────────────────────── */}
            <section>
              <SectionLabel num="07" title="オプション" />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Controller
                  name="isPublic"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(!watchedIsPublic)}
                      className={cn(
                        'flex flex-1 items-center gap-3 rounded-sm border px-4 py-3.5 transition-all',
                        watchedIsPublic ? 'border-primary/20 bg-primary/[0.04]' : 'border-border bg-white',
                      )}
                    >
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-sm', watchedIsPublic ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
                        {watchedIsPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black uppercase tracking-wide text-foreground/70">{watchedIsPublic ? '公開中' : '非公開'}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/50">{watchedIsPublic ? '他のユーザーに表示される' : '自分だけに見える'}</p>
                      </div>
                    </button>
                  )}
                />

                <Controller
                  name="notifyEmail"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(!watchedNotifyEmail)}
                      className={cn(
                        'flex flex-1 items-center gap-3 rounded-sm border px-4 py-3.5 transition-all',
                        watchedNotifyEmail ? 'border-primary/20 bg-primary/[0.04]' : 'border-border bg-white',
                      )}
                    >
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-sm', watchedNotifyEmail ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>
                        {watchedNotifyEmail ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black uppercase tracking-wide text-foreground/70">{watchedNotifyEmail ? '通知ON' : '通知OFF'}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/50">{watchedNotifyEmail ? 'マッチ時にメール通知' : '通知を受け取らない'}</p>
                      </div>
                    </button>
                  )}
                />
              </div>
            </section>

            {/* ── Submit ──────────────────────────────── */}
            <div className="border-t border-border pt-8">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className={cn(
                    'relative overflow-hidden bg-primary px-8 py-3 text-xs font-black uppercase tracking-[0.3em] text-white transition-opacity',
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
                  onClick={() => navigate('/wishes')}
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

export default WishNewPage
