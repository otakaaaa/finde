import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareScoreProps {
  /** 貰ったシャレ度の累計ポイント */
  totalScore: number
  ratingCount: number
  size?: 'sm' | 'lg'
}

/**
 * シャレ度の表示（主役指標）。
 * 平均点ではなく「送られたポイントの合計」を表示する
 * （増える一方の数値なので低評価で人を傷つけない）。票がなければ「—」。
 */
export const ShareScore = ({ totalScore, ratingCount, size = 'sm' }: ShareScoreProps) => (
  <div className="inline-flex items-center gap-1">
    <Sparkles className={cn('text-primary', size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
    <span
      className={cn(
        'font-headline font-black tabular-nums text-foreground',
        size === 'lg' ? 'text-lg' : 'text-[13px]',
      )}
    >
      {ratingCount > 0 ? totalScore : '—'}
    </span>
    {ratingCount > 0 && (
      <span className="text-[10px] tabular-nums text-muted-foreground/40">({ratingCount}人)</span>
    )}
  </div>
)
