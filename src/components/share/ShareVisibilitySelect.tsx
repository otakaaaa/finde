import { Globe, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShareVisibility } from '@/types'

interface Option {
  value: ShareVisibility
  label: string
  icon: React.ReactNode
}

const ACTIVE_OPTIONS: Option[] = [
  { value: 'public', label: '公開', icon: <Globe className="h-3.5 w-3.5" /> },
  { value: 'private', label: '非公開', icon: <Lock className="h-3.5 w-3.5" /> },
]

// フォロー機能と同時に有効化される将来項目（準備中）
const COMING_SOON = ['フォロワーのみ', '相互フォローのみ']

interface ShareVisibilitySelectProps {
  value: ShareVisibility
  onChange: (value: ShareVisibility) => void
}

export const ShareVisibilitySelect = ({ value, onChange }: ShareVisibilitySelectProps) => (
  <div className="flex flex-wrap gap-2">
    {ACTIVE_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-sm border px-3 py-2 text-[11px] font-bold transition-colors',
          value === opt.value
            ? 'border-primary bg-primary text-white'
            : 'border-border bg-white text-foreground/60 hover:border-primary/40',
        )}
        aria-pressed={value === opt.value}
      >
        {opt.icon}
        {opt.label}
      </button>
    ))}
    {COMING_SOON.map((label) => (
      <span
        key={label}
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-sm border border-dashed border-border bg-muted/30 px-3 py-2 text-[11px] font-bold text-muted-foreground/40"
        aria-disabled="true"
        title="フォロー機能の追加後に有効化されます"
      >
        {label}
        <span className="rounded-sm bg-muted px-1 py-0.5 text-[8px] font-black uppercase tracking-wide text-muted-foreground/50">
          準備中
        </span>
      </span>
    ))}
  </div>
)
