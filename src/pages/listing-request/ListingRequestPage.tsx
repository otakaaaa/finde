import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft, Store, Check, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

const listingRequestSchema = z.object({
  shopName: z.string().min(1, '店舗名を入力してください').max(100),
  address: z.string().max(200).optional(),
  categoryIds: z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  websiteUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  note: z.string().max(500).optional(),
  isOwnerRequest: z.boolean(),
})

type ListingRequestFormValues = z.infer<typeof listingRequestSchema>

const PROCESS_STEPS = [
  { num: '01', label: '申請フォームの送信', desc: '店舗情報を入力して送信' },
  { num: '02', label: 'スタッフによる審査', desc: '通常2〜5営業日' },
  { num: '03', label: '掲載開始のご連絡', desc: 'メールにてお知らせ' },
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
            スタッフが内容を確認の上、審査完了後にメールにてご連絡いたします。<br />
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

const ListingRequestPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, code, name').order('id') as {
        data: Category[] | null; error: unknown
      }
      return data ?? []
    },
    staleTime: Infinity,
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (values: ListingRequestFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      const { error } = await supabase.from('shop_listing_requests').insert({
        submitted_by: user.id,
        shop_name: values.shopName,
        address: values.address || null,
        category_ids: values.categoryIds,
        website_url: values.websiteUrl || null,
        note: values.note || null,
        is_owner_request: values.isOwnerRequest,
      } as never) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: () => setSubmitted(true),
  })

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<ListingRequestFormValues>({
    resolver: zodResolver(listingRequestSchema),
    defaultValues: { categoryIds: [], isOwnerRequest: false },
  })

  const selectedCategories = watch('categoryIds')
  const isOwnerRequest = watch('isOwnerRequest')

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
                — Listing Request
              </p>
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                SHOP<br className="sm:hidden" /> APPLICATION
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
              {/* What is this */}
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <Store className="h-3.5 w-3.5 text-muted-foreground/40" />
                  <span className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    About
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  フクナビに掲載したい店舗を申請してください。<br/>
                  スタッフが確認後、掲載いたします。<br/>
                  オーナーの方はオーナー申請を選択することで、ダッシュボードから店舗情報を管理できます。
                </p>
              </div>

              {/* Process steps */}
              <div>
                <span className="mb-4 block font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  Process
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

                {/* ── 01 SHOP INFO ─────────────────── */}
                <section>
                  <SectionLabel num="01" title="SHOP INFO" required />
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
                        <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/40">optional</span>
                      </label>
                      <input
                        type="text"
                        placeholder="例: 東京都渋谷区..."
                        className={inputClass}
                        {...register('address')}
                      />
                    </div>
                  </div>
                </section>

                {/* ── 02 CATEGORY ──────────────────── */}
                <section>
                  <SectionLabel num="02" title="CATEGORY" required />
                  <div className="flex flex-wrap gap-2">
                    {categories?.map((cat) => (
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

                {/* ── 03 ONLINE ────────────────────── */}
                <section>
                  <SectionLabel num="03" title="ONLINE" optional />
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                      公式サイトURL
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
                </section>

                {/* ── 04 NOTE ──────────────────────── */}
                <section>
                  <SectionLabel num="04" title="NOTE" optional />
                  <textarea
                    rows={4}
                    placeholder="店舗についての補足情報など…"
                    className={cn(
                      'w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm leading-relaxed',
                      'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
                      'resize-none',
                    )}
                    {...register('note')}
                  />
                </section>

                {/* ── 05 APPLICATION TYPE ──────────── */}
                <section>
                  <SectionLabel num="05" title="APPLICATION TYPE" />
                  <Controller
                    name="isOwnerRequest"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* User request */}
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={cn(
                            'flex items-start gap-3 rounded-sm border p-4 text-left transition-all',
                            !isOwnerRequest
                              ? 'border-primary/20 bg-primary/[0.04]'
                              : 'border-border bg-white hover:border-primary/20',
                          )}
                        >
                          <div className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                            !isOwnerRequest ? 'border-primary' : 'border-border',
                          )}>
                            {!isOwnerRequest && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="font-headline text-[11px] font-black uppercase tracking-wide text-foreground/70">
                              一般申請
                            </p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/50">
                              知っている店舗を掲載申請する
                            </p>
                          </div>
                        </button>

                        {/* Owner request */}
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={cn(
                            'flex items-start gap-3 rounded-sm border p-4 text-left transition-all',
                            isOwnerRequest
                              ? 'border-primary/20 bg-primary/[0.04]'
                              : 'border-border bg-white hover:border-primary/20',
                          )}
                        >
                          <div className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                            isOwnerRequest ? 'border-primary' : 'border-border',
                          )}>
                            {isOwnerRequest && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="font-headline text-[11px] font-black uppercase tracking-wide text-foreground/70">
                              オーナー申請
                            </p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/50">
                              自分の店舗として管理権限を申請する
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  />
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
                          SENDING...
                        </span>
                      ) : (
                        'SUBMIT APPLICATION'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
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
      </div>
    </div>
  )
}

export default ListingRequestPage
