import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareScoreProps {
  averageScore: number | null
  ratingCount: number
  size?: 'sm' | 'lg'
}

/** 平均シャレ度の表示（主役指標）。票がなければ「—」。 */
export const ShareScore = ({ averageScore, ratingCount, size = 'sm' }: ShareScoreProps) => (
  <div className="inline-flex items-center gap-1">
    <Sparkles className={cn('text-primary', size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
    <span
      className={cn(
        'font-headline font-black tabular-nums text-foreground',
        size === 'lg' ? 'text-lg' : 'text-[13px]',
      )}
    >
      {averageScore !== null ? averageScore.toFixed(1) : '—'}
    </span>
    {ratingCount > 0 && (
      <span className="text-[10px] tabular-nums text-muted-foreground/40">({ratingCount})</span>
    )}
  </div>
)
