import { useFormContext } from 'react-hook-form'
import { Globe, Phone } from 'lucide-react'
import { SectionLabel, Field, inputClass } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { ShopFormValues } from '@/components/shop/form/shopFormSchema'

interface ContactSectionProps {
  num: string
  animationDelay?: string
}

export const ContactSection = ({
  num,
  animationDelay = '120ms',
}: ContactSectionProps) => {
  const { register, formState: { errors } } = useFormContext<ShopFormValues>()

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="連絡先" icon={<Phone className="h-3.5 w-3.5" />} optional />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="電話番号" optional>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
            <input
              type="tel"
              placeholder="03-0000-0000"
              className={cn(inputClass, 'pl-9')}
              {...register('phone')}
            />
          </div>
        </Field>
        <Field label="公式サイト" optional error={errors.websiteUrl?.message}>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
            <input
              type="url"
              placeholder="https://example.com"
              className={cn(inputClass, 'pl-9', errors.websiteUrl && 'border-red-400')}
              {...register('websiteUrl')}
            />
          </div>
        </Field>
      </div>
    </section>
  )
}
