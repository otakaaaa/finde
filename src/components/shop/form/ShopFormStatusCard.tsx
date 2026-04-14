import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShopFormStatusCardProps {
  isPending: boolean
  isDirty: boolean
}

export const ShopFormStatusCard = ({ isPending, isDirty }: ShopFormStatusCardProps) => (
  <div className="border border-border bg-white px-4 py-3 editorial-shadow">
    <p className="mb-2 font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
      Status
    </p>
    <div className="mb-3 flex items-center gap-2">
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        isDirty ? 'animate-pulse bg-amber-400' : 'bg-emerald-400',
      )} />
      <span className="text-[10px] text-muted-foreground/60">
        {isDirty ? '未保存の変更があります' : '最新の状態です'}
      </span>
    </div>
    <button
      type="submit"
      disabled={isPending || !isDirty}
      className={cn(
        'flex w-full items-center justify-center gap-2 bg-primary',
        'font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white',
        'py-3 transition-opacity hover:opacity-90 disabled:opacity-40',
      )}
    >
      {isPending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          保存中…
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          変更を保存
        </>
      )}
    </button>
  </div>
)
