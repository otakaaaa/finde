import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useRateShare } from '@/hooks/useShareRatings'
import { cn } from '@/lib/utils'
import type { SharePost } from '@/types'

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

interface ShareRatingPopoverProps {
  post: SharePost
  onClose: () => void
}

export const ShareRatingPopover = ({ post, onClose }: ShareRatingPopoverProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { mutate, isPending } = useRateShare(post.id)

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute bottom-full left-0 z-30 mb-2 w-max rounded-sm border border-border bg-white p-3 editorial-shadow">
        <p className="mb-2.5 flex items-center gap-1.5 font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
          <Sparkles className="h-3 w-3 text-primary/60" />
          シャレ度を送る
          {post.myScore !== null && (
            <span className="text-primary">— 現在: {post.myScore}</span>
          )}
        </p>

        {user ? (
          <div className="grid grid-cols-5 gap-1">
            {SCORES.map((score) => (
              <button
                key={score}
                type="button"
                disabled={isPending}
                onClick={() => mutate(score, { onSuccess: onClose })}
                className={cn(
                  'flex h-8 w-8 items-center justify-center border font-headline text-[12px] font-black tabular-nums transition-all disabled:opacity-40',
                  post.myScore === score
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-foreground/60 hover:border-primary/50 hover:text-primary',
                )}
                aria-label={`シャレ度 ${score}`}
                aria-pressed={post.myScore === score}
              >
                {score}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/70">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="font-bold text-primary underline-offset-2 hover:underline"
            >
              ログイン
            </button>
            してシャレ度を送れます
          </p>
        )}
      </div>
    </>
  )
}
