import { z } from 'zod'
import { Clock } from 'lucide-react'
import type { FieldValues, UseFormRegister, Path } from 'react-hook-form'
import { SectionLabel } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { BusinessHours, DayHours } from '@/types'

// ── Config ──────────────────────────────────────────────────────

export const DAYS = [
  { key: 'mon', label: '月' },
  { key: 'tue', label: '火' },
  { key: 'wed', label: '水' },
  { key: 'thu', label: '木' },
  { key: 'fri', label: '金' },
  { key: 'sat', label: '土' },
  { key: 'sun', label: '日' },
] as const

export type DayKey = (typeof DAYS)[number]['key']

// ── Schema ───────────────────────────────────────────────────────

export const dayHoursSchema = z.object({
  enabled: z.boolean(),
  open:    z.string(),
  close:   z.string(),
})

export const businessHoursSchema = z.object({
  mon: dayHoursSchema, tue: dayHoursSchema, wed: dayHoursSchema,
  thu: dayHoursSchema, fri: dayHoursSchema, sat: dayHoursSchema, sun: dayHoursSchema,
})

// ── Types ────────────────────────────────────────────────────────

export type DayHoursEntry = { enabled: boolean; open: string; close: string }
export type BusinessHoursFormValues = Record<DayKey, DayHoursEntry>

// ── Helpers ──────────────────────────────────────────────────────

export const DEFAULT_HOURS_ENTRY: DayHoursEntry = { enabled: false, open: '10:00', close: '20:00' }

export const toFormEntry = (day: DayHours | null): DayHoursEntry => {
  if (!day) return { ...DEFAULT_HOURS_ENTRY }
  return { enabled: true, open: day.open, close: day.close }
}

export const toBusinessHours = (formHours: BusinessHoursFormValues): BusinessHours => {
  const toDay = (e: DayHoursEntry): DayHours | null =>
    e.enabled ? { open: e.open, close: e.close } : null
  return {
    mon: toDay(formHours.mon), tue: toDay(formHours.tue), wed: toDay(formHours.wed),
    thu: toDay(formHours.thu), fri: toDay(formHours.fri), sat: toDay(formHours.sat),
    sun: toDay(formHours.sun),
  }
}

// ── HoursRow ─────────────────────────────────────────────────────

function HoursRow<T extends FieldValues>({
  dayKey,
  label,
  enabled,
  register,
  onToggle,
}: {
  dayKey: DayKey
  label: string
  enabled: boolean
  register: UseFormRegister<T>
  onToggle: () => void
}) {
  const isWeekend = dayKey === 'sat' || dayKey === 'sun'
  const openPath  = `businessHours.${dayKey}.open`  as Path<T>
  const closePath = `businessHours.${dayKey}.close` as Path<T>

  return (
    <div className={cn(
      'flex items-center gap-3 border-b border-border/60 py-3 last:border-0',
      !enabled && 'opacity-50',
    )}>
      <span className={cn(
        'w-6 shrink-0 font-headline text-[12px] font-black',
        isWeekend ? 'text-primary/60' : 'text-foreground/50',
      )}>
        {label}
      </span>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
          enabled
            ? 'justify-end border-primary/20 bg-primary pr-0.5'
            : 'justify-start border-border bg-muted pl-0.5',
        )}
        aria-label={enabled ? '営業日' : '定休日'}
      >
        <span className={cn(
          'h-5 w-5 rounded-full shadow-sm',
          enabled ? 'bg-white' : 'bg-muted-foreground/20',
        )} />
      </button>

      <div className={cn('flex flex-1 items-center gap-2', !enabled && 'invisible')}>
        <input
          type="time"
          {...register(openPath)}
          className="h-8 rounded-sm border border-border bg-white px-2 font-mono text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <span className="font-headline text-[10px] font-black text-muted-foreground/30">—</span>
        <input
          type="time"
          {...register(closePath)}
          className="h-8 rounded-sm border border-border bg-white px-2 font-mono text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {!enabled && (
        <span className="font-headline text-[10px] font-black uppercase tracking-wider text-muted-foreground/30">
          定休日
        </span>
      )}
    </div>
  )
}

// ── ShopBusinessHoursSection ─────────────────────────────────────

interface ShopBusinessHoursSectionProps<T extends FieldValues> {
  num: string
  businessHours: Partial<Record<DayKey, { enabled: boolean }>> | undefined
  register: UseFormRegister<T>
  onToggle: (dayKey: DayKey) => void
  animationDelay?: string
}

export function ShopBusinessHoursSection<T extends FieldValues>({
  num,
  businessHours,
  register,
  onToggle,
  animationDelay = '0ms',
}: ShopBusinessHoursSectionProps<T>) {
  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="営業時間" icon={<Clock className="h-3.5 w-3.5" />} optional />
      <div className="border border-border bg-white px-4 editorial-shadow">
        {DAYS.map((day) => (
          <HoursRow
            key={day.key}
            dayKey={day.key}
            label={day.label}
            enabled={businessHours?.[day.key]?.enabled ?? false}
            register={register}
            onToggle={() => onToggle(day.key)}
          />
        ))}
      </div>
    </section>
  )
}
