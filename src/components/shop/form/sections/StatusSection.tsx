import { useFormContext, Controller } from 'react-hook-form'
import { SectionLabel } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { ShopFormValues } from '@/components/shop/form/shopFormSchema'

interface StatusOption {
  value: ShopFormValues['status']
  label: string
  sublabel: string
  badgeClass: string
}

interface StatusSectionProps {
  num: string
  mode?: 'new' | 'edit'
  animationDelay?: string
}

const STATUS_OPTIONS_NEW: StatusOption[] = [
  { value: 'public',  label: '公開',  sublabel: '即時公開する',      badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'pending', label: '審査中', sublabel: '審査待ちとして登録', badgeClass: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'private', label: '非公開', sublabel: '非公開で下書き保存', badgeClass: 'border-border bg-muted text-muted-foreground' },
]

const STATUS_OPTIONS_EDIT: StatusOption[] = [
  { value: 'public',  label: '公開',  sublabel: '一般公開中',  badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'pending', label: '審査中', sublabel: '審査待ち状態', badgeClass: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'private', label: '非公開', sublabel: '非公開で保存', badgeClass: 'border-border bg-muted text-muted-foreground' },
]

export const StatusSection = ({
  num,
  mode = 'edit',
  animationDelay = '180ms',
}: StatusSectionProps) => {
  const { control, watch } = useFormContext<ShopFormValues>()
  const watchedStatus = watch('status')
  const options = mode === 'new' ? STATUS_OPTIONS_NEW : STATUS_OPTIONS_EDIT

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="ステータス" />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-3 gap-3">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => field.onChange(opt.value)}
                className={cn(
                  'flex flex-col items-start rounded-sm border-2 bg-white p-3.5 text-left transition-all duration-150',
                  watchedStatus === opt.value
                    ? opt.badgeClass + ' border-current'
                    : 'border-border hover:border-primary/30',
                )}
              >
                <span className={cn(
                  'mb-1 font-headline text-[11px] font-black uppercase tracking-wide',
                  watchedStatus === opt.value ? 'opacity-100' : 'text-foreground/70',
                )}>
                  {opt.label}
                </span>
                <span className={cn(
                  'text-[10px] leading-relaxed',
                  watchedStatus === opt.value ? 'opacity-70' : 'text-muted-foreground/50',
                )}>
                  {opt.sublabel}
                </span>
              </button>
            ))}
          </div>
        )}
      />
    </section>
  )
}
