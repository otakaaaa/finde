import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm, FormProvider, useWatch, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Check, Store } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useShopMasterData } from '@/hooks/useShopMasterData'
import { SectionLabel, Field } from '@/components/shop/ShopFormUI'
import {
  ShopBusinessHoursSection,
  toBusinessHours,
  type DayKey,
} from '@/components/shop/ShopBusinessHoursSection'
import { ShopPhotoNewSection } from '@/components/shop/ShopPhotoNewSection'
import { BasicInfoSection } from '@/components/shop/form/sections/BasicInfoSection'
import { AddressSection } from '@/components/shop/form/sections/AddressSection'
import { PriceRangeSection } from '@/components/shop/form/sections/PriceRangeSection'
import { CategoriesSection } from '@/components/shop/form/sections/CategoriesSection'
import { BrandsSection } from '@/components/shop/form/sections/BrandsSection'
import { ContactSection } from '@/components/shop/form/sections/ContactSection'
import { SnsSection } from '@/components/shop/form/sections/SnsSection'
import {
  shopFormSchema,
  DEFAULT_SHOP_FORM_VALUES,
  type ShopFormValues,
} from '@/components/shop/form/shopFormSchema'
import { cn } from '@/lib/utils'
import { OWNER_FEATURE_ENABLED } from '@/config/features'
import type { Brand } from '@/types'

const BUCKET = 'shop-photos'

// shopFormSchema を拡張して note フィールドを追加
const listingRequestSchema = shopFormSchema.extend({
  note: z.string().max(500).optional(),
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

  const pendingFilesRef = useRef<File[]>([])
  const pendingBrandsRef = useRef<Brand[]>([])

  const methods = useForm<ListingRequestFormValues>({
    resolver: zodResolver(listingRequestSchema),
    defaultValues: DEFAULT_SHOP_FORM_VALUES,
  })

  const { handleSubmit, register, setValue, control, formState: { errors } } = methods
  const businessHours = useWatch({ control, name: 'businessHours' })

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (values: ListingRequestFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      const { data: request, error: insertError } = await supabase
        .from('shop_listing_requests')
        .insert({
          submitted_by:   user.id,
          shop_name:      values.name,
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

      const brands = pendingBrandsRef.current
      for (const brand of brands) {
        const { error: brandErr } = await supabase
          .from('listing_request_brands')
          .insert({ request_id: request.id, brand_id: brand.id } as never) as unknown as {
            error: { message: string } | null
          }
        if (brandErr) throw new Error(brandErr.message)
      }

      const files = pendingFilesRef.current
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
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

      return request.id
    },
    onSuccess: (requestId) => {
      // メール送信はfire-and-forget（失敗しても申請成功扱い）
      supabase.functions
        .invoke('send-listing-request-notification', { body: { request_id: requestId } })
        .catch(() => { /* ignore */ })
      setSubmitted(true)
    },
  })

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
                ← Back
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

            {/* ── Left sidebar (info) ──────────────── */}
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

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-12">

                  <BasicInfoSection num="01" animationDelay="0ms" />

                  <AddressSection
                    num="02"
                    prefectures={masterData?.prefectures ?? []}
                    cities={masterData?.cities ?? []}
                    animationDelay="40ms"
                  />

                  <PriceRangeSection
                    num="03"
                    priceRanges={masterData?.priceRanges ?? []}
                    animationDelay="60ms"
                  />

                  <CategoriesSection
                    num="04"
                    categories={masterData?.categories ?? []}
                    animationDelay="80ms"
                  />

                  <ShopPhotoNewSection
                    num="05"
                    onFilesChange={(files) => { pendingFilesRef.current = files }}
                    animationDelay="100ms"
                  />

                  <ContactSection num="06" animationDelay="120ms" />

                  <SnsSection num="07" animationDelay="160ms" />

                  <BrandsSection
                    num="09"
                    onBrandsChange={(brands) => { pendingBrandsRef.current = brands }}
                    animationDelay="190ms"
                  />

                  <ShopBusinessHoursSection
                    num="10"
                    businessHours={businessHours}
                    register={methods.register}
                    onToggle={(dayKey: DayKey) =>
                      setValue(
                        `businessHours.${dayKey}.enabled` as Path<ShopFormValues>,
                        !(businessHours?.[dayKey]?.enabled ?? false),
                        { shouldDirty: true },
                      )
                    }
                    animationDelay="200ms"
                  />

                  {/* 11 補足メモ */}
                  <section className="wish-card-enter" style={{ animationDelay: '210ms' }}>
                    <SectionLabel num="11" title="補足メモ" optional />
                    <Field label="フクナビ運営への補足" optional error={errors.note?.message}>
                      <textarea
                        rows={3}
                        placeholder="フクナビ運営への補足情報など…"
                        className={cn(
                          'w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm leading-relaxed',
                          'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
                          'resize-none',
                          errors.note && 'border-red-400',
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
              </FormProvider>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingRequestPage
