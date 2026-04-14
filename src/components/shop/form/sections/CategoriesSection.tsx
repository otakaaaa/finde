import { useFormContext } from 'react-hook-form'
import { SectionLabel } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { ShopFormValues } from '@/components/shop/form/shopFormSchema'
import type { Category } from '@/types'

interface CategoriesSectionProps {
  num: string
  categories: Category[]
  animationDelay?: string
}

export const CategoriesSection = ({
  num,
  categories,
  animationDelay = '80ms',
}: CategoriesSectionProps) => {
  const { watch, setValue, formState: { errors } } = useFormContext<ShopFormValues>()
  const selectedCategories = watch('categoryIds')

  const toggleCategory = (id: number) => {
    const current = selectedCategories ?? []
    setValue(
      'categoryIds',
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
      { shouldValidate: true, shouldDirty: true },
    )
  }

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="カテゴリ" required />
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
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
  )
}
