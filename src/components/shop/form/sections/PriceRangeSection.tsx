import { useFormContext } from 'react-hook-form'
import { SectionLabel, Field, selectClass } from '@/components/shop/ShopFormUI'
import type { ShopFormValues } from '@/components/shop/form/shopFormSchema'
import type { PriceRange } from '@/types'

interface PriceRangeSectionProps {
  num: string
  priceRanges: PriceRange[]
  animationDelay?: string
}

export const PriceRangeSection = ({
  num,
  priceRanges,
  animationDelay = '60ms',
}: PriceRangeSectionProps) => {
  const { register } = useFormContext<ShopFormValues>()

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="価格帯" optional />
      <div className="sm:w-1/2">
        <Field label="価格帯" optional>
          <select
            className={selectClass}
            {...register('priceRangeId', { valueAsNumber: true })}
          >
            <option value="">指定なし</option>
            {priceRanges.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.label}</option>
            ))}
          </select>
        </Field>
      </div>
    </section>
  )
}
