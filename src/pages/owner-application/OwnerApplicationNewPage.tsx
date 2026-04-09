import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ChevronLeft, Store, Check, ArrowRight, MessageCircle,
  Search, User, Phone, Instagram, FileText, Building2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

// ── Schema ─────────────────────────────────────────────────────

const schema = z.object({
  shopType:        z.enum(['existing', 'new']),
  existingShopId:  z.string().optional(),
  // 新規入力フィールド（shopType === 'new' のとき必須）
  shopName:        z.string().optional(),
  address:         z.string().max(200).optional(),
  categoryIds:     z.array(z.number()).optional(),
  websiteUrl:      z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  // 申請者情報
  applicantName:   z.string().min(1, '氏名を入力してください').max(100),
  applicantPhone:  z.string().min(1, '電話番号を入力してください').max(20),
  applicantRole:   z.enum(['owner', 'manager'], { required_error: '関係を選択してください' }),
  // 証明情報
  instagramHandle: z.string().max(50).optional(),
  note:            z.string().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.shopType === 'existing' && !data.existingShopId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '店舗を選択してください', path: ['existingShopId'] })
  }
  if (data.shopType === 'new') {
    if (!data.shopName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '店舗名を入力してください', path: ['shopName'] })
    }
    if (!data.categoryIds || data.categoryIds.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'カテゴリを1つ以上選択してください', path: ['categoryIds'] })
    }
  }
})

type FormValues = z.infer<typeof schema>

// ── Types ──────────────────────────────────────────────────────

interface ShopSearchResult {
  id: string
  name: string
  areas: { prefecture: string; city: string } | null
}

// ── Hooks ──────────────────────────────────────────────────────

const useShopSearch = (query: string) =>
  useQuery({
    queryKey: ['shop-search-owner', query],
    enabled: query.trim().length >= 1,
    queryFn: async () => {
      const { data } = await supabase
        .from('shops')
        .select('id, name, areas:area_id ( prefecture, city )')
        .eq('status', 'public')
        .ilike('name', `%${query.trim()}%`)
        .limit(8) as unknown as { data: ShopSearchResult[] | null; error: unknown }
      return data ?? []
    },
    staleTime: 30_000,
  })

// ── Constants ──────────────────────────────────────────────────

const OWNER_PROCESS_STEPS = [
  { num: '01', label: 'オーナー申請の送信',    desc: '店舗情報と本人情報を入力' },
  { num: '02', label: 'DM で本人確認',         desc: 'フクナビ運営とのやり取りで審査' },
  { num: '03', label: 'オーナー権限の付与',    desc: '承認後にダッシュボード利用可能' },
]

const inputClass = cn(
  'h-10 w-full border border-border bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
)

// ── Sub-components ─────────────────────────────────────────────

const SectionLabel = ({
  num, title, required, optional,
}: { num: string; title: string; required?: boolean; optional?: boolean }) => (
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

interface SubmittedScreenProps {
  requestId: string
  onBack: () => void
}

const SubmittedScreen = ({ requestId, onBack }: SubmittedScreenProps) => (
  <div>
    <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
      <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
        <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
          style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
          SENT
        </span>
      </div>
      <div className="relative mx-auto max-w-3xl pb-6">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— MYPAGE</p>
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
              オーナー申請を受け付けました
            </span>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            フクナビ運営より、DMにてご連絡します。<br />
            DMのやり取りで本人確認を行い、審査完了後にオーナー権限を付与いたします。
          </p>
          <Link
            to={`/owner-application/${requestId}`}
            className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            DM スレッドを開く
          </Link>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 border border-border bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.3em] text-foreground/60 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          トップへ戻る
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  </div>
)

// ── Shop search + select component ─────────────────────────────

interface ShopSelectorProps {
  value: string | undefined
  onChange: (id: string, name: string) => void
  error?: string
}

const ShopSelector = ({ value, onChange, error }: ShopSelectorProps) => {
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [showResults, setShowResults] = useState(false)

  const { data: results, isFetching } = useShopSearch(query)

  const handleSelect = (shop: ShopSearchResult) => {
    onChange(shop.id, shop.name)
    setSelectedName(shop.name)
    setQuery('')
    setShowResults(false)
  }

  const handleClear = () => {
    onChange('', '')
    setSelectedName('')
  }

  return (
    <div>
      {value && selectedName ? (
        <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-headline text-[12px] font-black tracking-tight text-emerald-800">
              {selectedName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="font-headline text-[9px] font-black uppercase tracking-wider text-emerald-600/60 hover:text-emerald-700"
          >
            変更
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="店舗名で検索…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              className={cn(
                'h-10 w-full border border-border bg-white pl-9 pr-3 text-sm text-foreground',
                'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
                error && 'border-red-400',
              )}
            />
            {isFetching && (
              <div className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            )}
          </div>

          {showResults && results && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full border border-border bg-white editorial-shadow">
              {results.map((shop) => (
                <button
                  key={shop.id}
                  type="button"
                  onMouseDown={() => handleSelect(shop)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                  <div>
                    <p className="font-headline text-[12px] font-black tracking-tight text-foreground/80">{shop.name}</p>
                    {shop.areas && (
                      <p className="text-[10px] text-muted-foreground/50">
                        {shop.areas.prefecture} {shop.areas.city}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && query.length >= 1 && !isFetching && results?.length === 0 && (
            <div className="absolute z-20 mt-1 w-full border border-border bg-white px-3 py-3 editorial-shadow">
              <p className="text-[11px] text-muted-foreground/50">「{query}」に一致する店舗が見つかりません</p>
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-[10px] font-medium text-red-500">{error}</p>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const OwnerApplicationNewPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null)
  const [selectedShopName, setSelectedShopName] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories').select('id, code, name').order('id') as {
          data: Category[] | null; error: unknown
        }
      return data ?? []
    },
    staleTime: Infinity,
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error('ログインが必要です')

      const shopName = values.shopType === 'existing'
        ? selectedShopName
        : (values.shopName ?? '')

      // Instagram の @ プレフィックスを正規化
      const igHandle = values.instagramHandle?.replace(/^@/, '') || null

      const { data, error } = await supabase
        .from('shop_listing_requests')
        .insert({
          submitted_by:     user.id,
          shop_name:        shopName,
          address:          values.shopType === 'new' ? (values.address || null) : null,
          category_ids:     values.shopType === 'new' ? (values.categoryIds ?? []) : [],
          website_url:      values.shopType === 'new' ? (values.websiteUrl || null) : null,
          note:             values.note || null,
          is_owner_request: true,
          applicant_name:   values.applicantName,
          applicant_phone:  values.applicantPhone,
          applicant_role:   values.applicantRole,
          instagram_handle: igHandle,
          existing_shop_id: values.shopType === 'existing' ? (values.existingShopId ?? null) : null,
        } as never)
        .select('id')
        .single() as unknown as {
          data: { id: string } | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => setSubmittedRequestId(data?.id ?? null),
  })

  const {
    register, handleSubmit, watch, setValue, control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      shopType: 'existing',
      categoryIds: [],
      applicantRole: 'owner',
    },
  })

  const shopType = watch('shopType')
  const selectedCategoryIds = watch('categoryIds') ?? []

  const toggleCategory = (id: number) => {
    setValue(
      'categoryIds',
      selectedCategoryIds.includes(id)
        ? selectedCategoryIds.filter((c) => c !== id)
        : [...selectedCategoryIds, id],
      { shouldValidate: true },
    )
  }

  if (submittedRequestId) {
    return <SubmittedScreen requestId={submittedRequestId} onBack={() => navigate('/')} />
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            OWNER
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <button type="button" onClick={() => navigate(-1)}
              className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              Back
            </button>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — MYPAGE
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              オーナー申請
            </h1>
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
                    About
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  あなたが経営・管理している店舗のオーナー権限を申請します。<br />
                  フクナビ運営とのDMで本人確認を行い、承認後にダッシュボードから店舗情報を管理できるようになります。
                </p>
              </div>

              <div>
                <span className="mb-4 block font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  Process
                </span>
                <div className="space-y-0">
                  {OWNER_PROCESS_STEPS.map((step, i) => (
                    <div key={step.num} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-white">
                          <span className="font-headline text-[9px] font-black tabular-nums">{step.num}</span>
                        </div>
                        {i < OWNER_PROCESS_STEPS.length - 1 && (
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

              <div className="mt-2 border-t border-border pt-5">
                <p className="text-[10px] text-muted-foreground/40">
                  掲載のみを申請する場合は{' '}
                  <Link to="/listing-request" className="font-bold text-foreground/60 underline underline-offset-4 hover:text-primary transition-colors">
                    掲載申請
                  </Link>
                  {' '}をご利用ください。
                </p>
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

                {/* ── 01 対象店舗 ──────────────────── */}
                <section>
                  <SectionLabel num="01" title="対象店舗" required />

                  {/* Shop type toggle */}
                  <Controller
                    name="shopType"
                    control={control}
                    render={({ field }) => (
                      <div className="mb-5 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange('existing')}
                          className={cn(
                            'flex items-start gap-3 border p-4 text-left transition-all',
                            shopType === 'existing'
                              ? 'border-primary/20 bg-primary/[0.04]'
                              : 'border-border bg-white hover:border-primary/20',
                          )}
                        >
                          <div className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                            shopType === 'existing' ? 'border-primary' : 'border-border',
                          )}>
                            {shopType === 'existing' && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="font-headline text-[11px] font-black uppercase tracking-wide text-foreground/70">
                              既存の店舗
                            </p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/50">
                              フクナビに掲載済みの店舗から選ぶ
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => field.onChange('new')}
                          className={cn(
                            'flex items-start gap-3 border p-4 text-left transition-all',
                            shopType === 'new'
                              ? 'border-primary/20 bg-primary/[0.04]'
                              : 'border-border bg-white hover:border-primary/20',
                          )}
                        >
                          <div className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                            shopType === 'new' ? 'border-primary' : 'border-border',
                          )}>
                            {shopType === 'new' && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="font-headline text-[11px] font-black uppercase tracking-wide text-foreground/70">
                              まだ掲載されていない
                            </p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/50">
                              店舗情報を新たに入力する
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  />

                  {/* 既存店舗: 検索 */}
                  {shopType === 'existing' && (
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        店舗を検索
                      </label>
                      <Controller
                        name="existingShopId"
                        control={control}
                        render={({ field }) => (
                          <ShopSelector
                            value={field.value}
                            onChange={(id, name) => {
                              field.onChange(id)
                              setSelectedShopName(name)
                            }}
                            error={errors.existingShopId?.message}
                          />
                        )}
                      />
                    </div>
                  )}

                  {/* 新規店舗: 入力フォーム */}
                  {shopType === 'new' && (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                          店舗名
                        </label>
                        <input
                          type="text"
                          placeholder="例: ○○古着店"
                          className={cn(inputClass, errors.shopName && 'border-red-400')}
                          {...register('shopName')}
                        />
                        {errors.shopName && (
                          <p className="mt-1 text-[10px] font-medium text-red-500">{errors.shopName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                          住所
                          <span className="ml-2 inline-flex items-center gap-1 rounded-sm border border-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-muted-foreground/40">
                            <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/30" />
                            任意
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="例: 東京都渋谷区..."
                          className={inputClass}
                          {...register('address')}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                          カテゴリ
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {categories?.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleCategory(cat.id)}
                              className={cn(
                                'border px-3 py-2 text-[11px] font-bold transition-all',
                                selectedCategoryIds.includes(cat.id)
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                              )}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                        {errors.categoryIds && (
                          <p className="mt-1 text-[10px] font-medium text-red-500">{errors.categoryIds.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                          公式サイト URL
                          <span className="ml-2 inline-flex items-center gap-1 rounded-sm border border-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-muted-foreground/40">
                            <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/30" />
                            任意
                          </span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com"
                          className={cn(inputClass, errors.websiteUrl && 'border-red-400')}
                          {...register('websiteUrl')}
                        />
                        {errors.websiteUrl && (
                          <p className="mt-1 text-[10px] font-medium text-red-500">{errors.websiteUrl.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* ── 02 申請者情報 ─────────────────── */}
                <section>
                  <SectionLabel num="02" title="申請者情報" required />
                  <p className="mb-4 text-[10px] leading-relaxed text-muted-foreground/50">
                    本人確認のために使用します。公開されません。
                  </p>
                  <div className="space-y-4">

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        <User className="h-3 w-3" />
                        氏名（本名）
                      </label>
                      <input
                        type="text"
                        placeholder="例: 山田 太郎"
                        autoComplete="name"
                        className={cn(inputClass, errors.applicantName && 'border-red-400')}
                        {...register('applicantName')}
                      />
                      {errors.applicantName && (
                        <p className="mt-1 text-[10px] font-medium text-red-500">{errors.applicantName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        <Phone className="h-3 w-3" />
                        電話番号
                      </label>
                      <input
                        type="tel"
                        placeholder="例: 090-1234-5678"
                        autoComplete="tel"
                        className={cn(inputClass, errors.applicantPhone && 'border-red-400')}
                        {...register('applicantPhone')}
                      />
                      {errors.applicantPhone && (
                        <p className="mt-1 text-[10px] font-medium text-red-500">{errors.applicantPhone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        店舗との関係
                      </label>
                      <Controller
                        name="applicantRole"
                        control={control}
                        render={({ field }) => (
                          <div className="flex gap-2">
                            {[
                              { value: 'owner',   label: 'オーナー', desc: '経営者・店主' },
                              { value: 'manager', label: '運営スタッフ', desc: '管理権限を持つ従業員' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => field.onChange(opt.value)}
                                className={cn(
                                  'flex flex-1 items-start gap-2.5 border p-3.5 text-left transition-all',
                                  field.value === opt.value
                                    ? 'border-primary/20 bg-primary/[0.04]'
                                    : 'border-border bg-white hover:border-primary/20',
                                )}
                              >
                                <div className={cn(
                                  'mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2',
                                  field.value === opt.value ? 'border-primary' : 'border-border',
                                )}>
                                  {field.value === opt.value && (
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-headline text-[11px] font-black tracking-tight text-foreground/70">
                                    {opt.label}
                                  </p>
                                  <p className="mt-0.5 text-[9px] text-muted-foreground/50">{opt.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </section>

                {/* ── 03 証明情報 ───────────────────── */}
                <section>
                  <SectionLabel num="03" title="証明情報" optional />
                  <p className="mb-4 text-[10px] leading-relaxed text-muted-foreground/50">
                    審査をスムーズに進めるために、できる限りご記入ください。
                  </p>
                  <div className="space-y-4">

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        <Instagram className="h-3 w-3" />
                        Instagram アカウント
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/40">@</span>
                        <input
                          type="text"
                          placeholder="shopname"
                          className={cn(inputClass, 'pl-7')}
                          {...register('instagramHandle')}
                        />
                      </div>
                      <p className="mt-1 text-[9px] text-muted-foreground/40">
                        フクナビ運営が店舗アカウントと照合する場合があります
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        <FileText className="h-3 w-3" />
                        運営への補足・連絡事項
                      </label>
                      <textarea
                        rows={4}
                        placeholder={[
                          '例:',
                          '・店舗の Instagram に確認メッセージを送っていただければ対応可能です',
                          '・開店日時は〇〇年〇〇月です',
                          '・その他、審査に役立つ情報があればご記入ください',
                        ].join('\n')}
                        className={cn(
                          'w-full border border-border bg-white px-3 py-2.5 text-sm leading-relaxed resize-none',
                          'placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50',
                        )}
                        {...register('note')}
                      />
                    </div>
                  </div>
                </section>

                {/* ── Submit ───────────────────────── */}
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

export default OwnerApplicationNewPage
