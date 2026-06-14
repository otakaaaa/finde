import { Link } from 'react-router'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRateShare } from '@/hooks/useShareRatings'
import { cn } from '@/lib/utils'
import type { SharePost } from '@/types'

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface ShareRatingInputProps {
  post: SharePost
}

/** シャレ度（1〜10）入力。自投稿には表示せず、未ログインはログイン誘導。 */
export const ShareRatingInput = ({ post }: ShareRatingInputProps) => {
  const { user } = useAuth()
  const { mutate, isPending } = useRateShare(post.id)

  if (user && user.id === post.userId) return null

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary/50" />
        <span className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
          シャレ度を送る
        </span>
        {post.myScore !== null && (
          <span className="text-[10px] font-bold text-primary">あなた: {post.myScore}</span>
        )}
      </div>

      {user ? (
        <div className="flex flex-wrap gap-1">
          {SCORES.map((score) => (
            <button
              key={score}
              type="button"
              disabled={isPending}
              onClick={() => mutate(score)}
              className={cn(
                'h-8 w-8 rounded-sm border text-[12px] font-black tabular-nums transition-colors disabled:opacity-50',
                post.myScore === score
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-white text-foreground/60 hover:border-primary/40 hover:text-primary',
              )}
              aria-label={`シャレ度 ${score}`}
              aria-pressed={post.myScore === score}
            >
              {score}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          <Link to="/auth/login" className="font-bold text-primary underline-offset-2 hover:underline">
            ログイン
          </Link>
          するとシャレ度を送れます。
        </p>
      )}
    </div>
  )
}
