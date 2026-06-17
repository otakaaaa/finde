import { useFormContext } from 'react-hook-form'
import { SectionLabel, Field, selectClass } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { ShopFormValues } from '@/components/shop/form/shopFormSchema'
import type { PriceRange } from '@/types'

interface PriceRangeSectionProps {
  num: string
  priceRanges: PriceRange[]
  priceRangeRequired?: boolean
  animationDelay?: string
}

export const PriceRangeSection = ({
  num,
  priceRanges,
  priceRangeRequired = false,
  animationDelay = '60ms',
}: PriceRangeSectionProps) => {
  const { register, formState: { errors } } = useFormContext<ShopFormValues>()

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="価格帯" optional={!priceRangeRequired} required={priceRangeRequired} />
      <div className="sm:w-1/2">
        <Field label="価格帯" optional={!priceRangeRequired} error={errors.priceRangeId?.message}>
          <select
            className={cn(selectClass, errors.priceRangeId && 'border-red-400')}
            {...register('priceRangeId', { valueAsNumber: true })}
          >
            <option value="">選択してください</option>
            {priceRanges.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.label}</option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  )
}
