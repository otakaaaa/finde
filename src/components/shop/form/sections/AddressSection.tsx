import { useFormContext, Controller } from 'react-hook-form'
import { SectionLabel, Field, inputClass, selectClass } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { ShopFormValues } from '@/components/shop/form/shopFormSchema'
import type { City, Prefecture } from '@/types'

interface AddressSectionProps {
  num: string
  prefectures: Prefecture[]
  cities: City[]
  animationDelay?: string
}

export const AddressSection = ({
  num,
  prefectures,
  cities,
  animationDelay = '40ms',
}: AddressSectionProps) => {
  const { register, watch, control, formState: { errors } } = useFormContext<ShopFormValues>()
  const watchedPrefectureId = watch('prefectureId')
  const citiesForPrefecture = cities.filter((c) => c.prefectureId === watchedPrefectureId)

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="住所" required />
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="都道府県" error={errors.prefectureId?.message}>
            <select
              className={cn(selectClass, errors.prefectureId && 'border-red-400')}
              {...register('prefectureId', { valueAsNumber: true })}
            >
              <option value="">選択してください</option>
              {prefectures.map((pref) => (
                <option key={pref.id} value={pref.id}>{pref.name}</option>
              ))}
            </select>
          </Field>
          <Field label="市区町村" error={errors.cityId?.message}>
            <Controller
              name="cityId"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className={cn(selectClass, errors.cityId && 'border-red-400')}
                  disabled={!watchedPrefectureId || citiesForPrefecture.length === 0}
                >
                  <option value="">選択してください</option>
                  {citiesForPrefecture.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            />
          </Field>
        </div>
        <Field label="町名・番地・建物名" optional>
          <input
            type="text"
            placeholder="例: 道玄坂1-1-1 ○○ビル2F"
            className={inputClass}
            {...register('address')}
          />
        </Field>
      </div>
    </section>
  )
}
