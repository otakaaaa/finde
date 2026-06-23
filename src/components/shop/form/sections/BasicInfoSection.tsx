import { useFormContext } from 'react-hook-form'
import { SectionLabel, Field, inputClass } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { ShopFormValues } from '@/components/shop/form/shopFormSchema'

interface BasicInfoSectionProps {
  num: string
  showDescriptionCounter?: boolean
  animationDelay?: string
}

export const BasicInfoSection = ({
  num,
  showDescriptionCounter = false,
  animationDelay = '0ms',
}: BasicInfoSectionProps) => {
  const { register, watch, formState: { errors } } = useFormContext<ShopFormValues>()
  const description = watch('description')

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="基本情報" required />
      <div className="space-y-4">
        <Field label="店舗名" error={errors.name?.message}>
          <input
            type="text"
            placeholder="例: ○○ショップ"
            className={cn(inputClass, errors.name && 'border-red-400')}
            {...register('name')}
          />
        </Field>
        <Field label="店舗説明" optional error={errors.description?.message}>
          <textarea
            rows={showDescriptionCounter ? 6 : 4}
            placeholder={
              showDescriptionCounter
                ? '店舗の特徴やコンセプト、セレクトのこだわりなどをご紹介ください…'
                : '店舗の特徴、取り扱いブランド、雰囲気など…'
            }
            className={cn(
              'w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm leading-relaxed',
              'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
              'resize-none',
              errors.description && 'border-red-400',
            )}
            {...register('description')}
          />
          {showDescriptionCounter && (
            <div className="mt-1 flex justify-end">
              <span className="font-mono text-[9px] text-muted-foreground/30">
                {description?.length ?? 0} / 2000
              </span>
            </div>
          )}
        </Field>
      </div>
    </section>
  )
}
