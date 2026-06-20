import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm, FormProvider, useWatch, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Check, Store } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
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

// shopFormSchema を拡張して掲載申請専用のバリデーションを追加
const listingRequestSchema = shopFormSchema.extend({
  cityId: z.number({
    required_error:    '市区町村を選択してください',
    invalid_type_error: '市区町村を選択してください',
  }),
  priceRangeId: z.number({
    required_error:    '価格帯を選択してください',
    invalid_type_error: '価格帯を選択してください',
  }),
  note: z.string().max(500).optional(),
})

type ListingRequestFormValues = z.infer<typeof listingRequestSchema>

const PROCESS_STEPS = [
  { num: '01', label: '申請フォームの送信', desc: '店舗情報を入力して送信' },
  { num: '02', label: 'FINDE運営による審査', desc: '通常 1 ~ 2 週間以内' },
  { num: '03', label: '掲載開始のご連絡', desc: 'メールにてお知らせ' },
]

const SUBMISSION_GUIDELINES = [
  '申請できるのは、日本国内に実在する古着屋・セレクトショップです。',
  '掲載する写真は、ご自身で撮影したものなど、掲載する権利をお持ちの画像のみをご使用ください。',
  '第三者が運営する店舗も申請いただけますが、店舗からの掲載辞退・削除のご依頼があった場合は対応いたします。',
  '虚偽・誇大な情報や、店舗と無関係な画像が含まれる場合は、掲載を見送ることがあります。',
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
            FINDE運営が内容を確認の上、審査完了後にメールにてご連絡いたします。<br />
            通常 1 ~ 2 週間以内にご連絡いたします。
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
        const path = `listing-requests/${request.id}/${crypto.randomUUID()}.webp`
        await uploadToR2('shop-photos', path, file)
        const { error: photoErr } = await supabase
          .from('listing_request_photos')
          .insert({ request_id: request.id, storage_path: path, order: i } as never) as unknown as {
            error: { message: string } | null
          }
        if (photoErr) {
          await deleteFromR2('shop-photos', [path])
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
          <div className="flex items-end justify-between pb-8">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
              >
                ← Back
              </button>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                — Shop Application
              </p>
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-5xl">
                店舗掲載申請
              </h1>
              <p className="mt-3 text-sm text-white/50">
                FINDEへの店舗掲載をご希望の方はこちらからお申し込みください
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-column layout ─────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr] lg:gap-14">

            {/* ── Left sidebar (info) ──────────────── */}
            <aside className="lg:sticky lg:top-8 lg:self-start">

              {/* 申請について */}
              <div className="mb-6 border-l-[3px] border-l-primary/30 bg-white px-4 py-5 editorial-shadow">
                <div className="mb-3 flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary/50" />
                  <span className="font-headline text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
                    掲載申請について
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/70">
                  FINDEに掲載したい店舗を申請してください。FINDE運営が確認後、掲載いたします。
                </p>
                {OWNER_FEATURE_ENABLED && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs leading-relaxed text-muted-foreground/70">
                      店舗のオーナー・スタッフの方は
                      <Link
                        to="/owner-application/new"
                        className="mx-0.5 font-bold text-primary underline-offset-2 hover:underline"
                      >
                        オーナー申請
                      </Link>
                      からご申請ください。
                    </p>
                  </div>
                )}
              </div>

              {/* 申請の流れ */}
              <div className="mb-6">
                <p className="mb-4 font-headline text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
                  申請の流れ
                </p>
                <div>
                  {PROCESS_STEPS.map((step, i) => (
                    <div key={step.num} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary text-white">
                          <span className="font-headline text-[10px] font-black tabular-nums">{step.num}</span>
                        </div>
                        {i < PROCESS_STEPS.length - 1 && (
                          <div className="my-1.5 w-px flex-1 bg-border" style={{ minHeight: '24px' }} />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className="font-headline text-[13px] font-black tracking-tight text-foreground/80">
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground/60">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ガイドライン */}
              <div className="rounded-sm border border-border bg-muted/20 px-4 py-5">
                <p className="mb-4 font-headline text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
                  掲載前にご確認ください
                </p>
                <ul className="space-y-3.5">
                  {SUBMISSION_GUIDELINES.map((text, i) => (
                    <li key={i} className="flex gap-3">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                      <span className="text-xs leading-relaxed text-foreground/65">{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground/50">
                  申請内容は
                  <Link to="/terms" className="mx-0.5 font-bold text-primary underline-offset-2 hover:underline">
                    利用規約
                  </Link>
                  に従って取り扱われます。
                </p>
              </div>
            </aside>

            {/* ── Form ─────────────────────────────── */}
            <div>
              {error && (
                <div className="mb-8 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-4">
                  <p className="mb-0.5 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-red-600/70">エラー</p>
                  <p className="text-sm text-red-700">{(error as Error).message}</p>
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
                    priceRangeRequired
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
                    <Field label="FINDE運営への補足" optional error={errors.note?.message}>
                      <textarea
                        rows={3}
                        placeholder="FINDE運営への補足情報など…"
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
