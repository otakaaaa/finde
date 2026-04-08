import { cn } from '@/lib/utils'

export const inputClass = cn(
  'h-10 w-full rounded-sm border border-border bg-white px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
)

export const selectClass = cn(
  'h-10 w-full rounded-sm border border-border bg-white px-3 text-sm text-foreground',
  'focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none',
)

interface SectionLabelProps {
  num: string
  title: string
  icon?: React.ReactNode
  optional?: boolean
  required?: boolean
}

export const SectionLabel = ({ num, title, icon, optional, required }: SectionLabelProps) => (
  <div className="mb-5 flex items-center gap-3">
    <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">{num}</span>
    {icon && <span className="text-muted-foreground/40">{icon}</span>}
    <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">{title}</span>
    {required && (
      <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        必須
      </span>
    )}
    {optional && (
      <span className="inline-flex items-center gap-1 rounded-sm border border-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/40">
        <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/30" />
        任意
      </span>
    )}
    <span className="h-px flex-1 bg-border" />
  </div>
)

interface FieldProps {
  label: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}

export const Field = ({ label, optional, error, children }: FieldProps) => (
  <div>
    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
      {label}
      {optional && (
        <span className="ml-2 inline-flex items-center gap-1 rounded-sm border border-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-medium normal-case tracking-normal text-muted-foreground/40">
          <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/30" />
          任意
        </span>
      )}
    </label>
    {children}
    {error && <p className="mt-1 text-[10px] font-medium text-red-500">{error}</p>}
  </div>
)

