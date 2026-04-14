import { useFormContext } from 'react-hook-form'
import { Instagram } from 'lucide-react'
import { XLogo } from '@/components/icons/XLogo'
import { TikTokLogo } from '@/components/icons/TikTokLogo'
import { SectionLabel, Field, inputClass } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { ShopFormValues } from '@/components/shop/form/shopFormSchema'

interface SnsSectionProps {
  num: string
  animationDelay?: string
}

export const SnsSection = ({
  num,
  animationDelay = '160ms',
}: SnsSectionProps) => {
  const { register, formState: { errors } } = useFormContext<ShopFormValues>()

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="SNS" optional />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Instagram" optional error={errors.instagramUrl?.message}>
          <div className="relative">
            <Instagram className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
            <input
              type="url"
              placeholder="https://instagram.com/..."
              className={cn(inputClass, 'pl-9', errors.instagramUrl && 'border-red-400')}
              {...register('instagramUrl')}
            />
          </div>
        </Field>
        <Field label="X" optional error={errors.twitterUrl?.message}>
          <div className="relative">
            <XLogo className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
            <input
              type="url"
              placeholder="https://x.com/..."
              className={cn(inputClass, 'pl-9', errors.twitterUrl && 'border-red-400')}
              {...register('twitterUrl')}
            />
          </div>
        </Field>
        <Field label="TikTok" optional error={errors.tiktokUrl?.message}>
          <div className="relative">
            <TikTokLogo className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
            <input
              type="url"
              placeholder="https://tiktok.com/@..."
              className={cn(inputClass, 'pl-9', errors.tiktokUrl && 'border-red-400')}
              {...register('tiktokUrl')}
            />
          </div>
        </Field>
      </div>
    </section>
  )
}
