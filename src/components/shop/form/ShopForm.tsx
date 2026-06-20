import { type ReactNode } from 'react'
import { FormProvider, useWatch, type UseFormReturn, type Path } from 'react-hook-form'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ShopFormValues } from '@/components/shop/form/shopFormSchema'
import { ShopFormHeader } from '@/components/shop/form/ShopFormHeader'
import { ShopFormStatusCard } from '@/components/shop/form/ShopFormStatusCard'
import { BasicInfoSection } from '@/components/shop/form/sections/BasicInfoSection'
import { AddressSection } from '@/components/shop/form/sections/AddressSection'
import { PriceRangeSection } from '@/components/shop/form/sections/PriceRangeSection'
import { CategoriesSection } from '@/components/shop/form/sections/CategoriesSection'
import { ContactSection } from '@/components/shop/form/sections/ContactSection'
import { SnsSection } from '@/components/shop/form/sections/SnsSection'
import { StatusSection } from '@/components/shop/form/sections/StatusSection'
import {
  ShopBusinessHoursSection,
  type DayKey,
} from '@/components/shop/ShopBusinessHoursSection'
import type { Category, City, PriceRange, Prefecture } from '@/types'

interface ShopMasterData {
  prefectures: Prefecture[]
  cities: City[]
  categories: Category[]
  priceRanges: PriceRange[]
}

interface ShopFormHeaderConfig {
  backgroundText: 'CREATE' | 'EDIT'
  context: 'admin' | 'owner'
  backLabel: string
  backLink: string
  title: string
  subtitle?: string
  headerRight?: ReactNode
}

interface ShopFormProps {
  methods: UseFormReturn<ShopFormValues>
  mode: 'new' | 'edit'
  showStatus: boolean
  showBusinessHours: boolean
  showSidebar: boolean
  showDescriptionCounter?: boolean
  masterData: ShopMasterData | undefined
  photoSlot?: ReactNode
  sidebarChildren?: ReactNode
  onSubmit: (values: ShopFormValues) => void | Promise<void>
  isPending: boolean
  errorMessage?: string
  headerProps: ShopFormHeaderConfig
  cancelLink?: string
}

export const ShopForm = ({
  methods,
  mode,
  showStatus,
  showBusinessHours,
  showSidebar,
  showDescriptionCounter = false,
  masterData,
  photoSlot,
  sidebarChildren,
  onSubmit,
  isPending,
  errorMessage,
  headerProps,
  cancelLink,
}: ShopFormProps) => {
  const { handleSubmit, setValue, control, formState: { isDirty } } = methods

  const businessHours = useWatch({ control, name: 'businessHours' })

  // Dynamic section numbering
  let sectionIndex = 1
  const nextNum = () => String(sectionIndex++).padStart(2, '0')

  const s01 = nextNum() // 基本情報
  const s02 = nextNum() // 住所
  const s03 = nextNum() // 価格帯
  const s04 = nextNum() // カテゴリ
  const s05 = nextNum() // 写真
  const s06 = nextNum() // 連絡先
  const s07 = nextNum() // SNS
  const s08 = showStatus ? nextNum() : null        // ステータス (adminのみ)
  const s09 = showBusinessHours ? nextNum() : null // 営業時間

  // s05 is reserved for photo slot even if no photoSlot is passed
  void s05

  return (
    <div>
      <ShopFormHeader {...headerProps} />

      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14">

          {errorMessage && (
            <div className="mb-8 border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{errorMessage}</p>
            </div>
          )}

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={cn(
                'grid grid-cols-1',
                showSidebar && 'gap-10 lg:grid-cols-[1fr_220px] lg:gap-14',
              )}>
                <div className="space-y-12">

                  <BasicInfoSection
                    num={s01}
                    showDescriptionCounter={showDescriptionCounter}
                    animationDelay="0ms"
                  />

                  <AddressSection
                    num={s02}
                    prefectures={masterData?.prefectures ?? []}
                    cities={masterData?.cities ?? []}
                    animationDelay="40ms"
                  />

                  <PriceRangeSection
                    num={s03}
                    priceRanges={masterData?.priceRanges ?? []}
                    priceRangeRequired
                    animationDelay="60ms"
                  />

                  <CategoriesSection
                    num={s04}
                    categories={masterData?.categories ?? []}
                    animationDelay="80ms"
                  />

                  {photoSlot}

                  <ContactSection num={s06} animationDelay="120ms" />

                  <SnsSection num={s07} animationDelay="160ms" />

                  {s08 && showStatus && (
                    <StatusSection num={s08} mode={mode} animationDelay="180ms" />
                  )}

                  {s09 && showBusinessHours && (
                    <ShopBusinessHoursSection
                      num={s09}
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
                  )}

                </div>

                {/* Sidebar */}
                {showSidebar && (
                  <aside className="lg:sticky lg:top-8 lg:self-start">
                    <div className="space-y-4">
                      <ShopFormStatusCard isPending={isPending} isDirty={isDirty} />
                      {sidebarChildren}
                    </div>
                  </aside>
                )}

              </div>

              {/* 新規登録モード: ボトムSubmit */}
              {mode === 'new' && (
                <div className="mt-12 border-t border-border pt-8">
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
                    {cancelLink && (
                      <a
                        href={cancelLink}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        キャンセル
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 編集モード: モバイル用ボトムSubmit */}
              {mode === 'edit' && (
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
              )}

            </form>
          </FormProvider>

        </div>
      </div>
    </div>
  )
}
