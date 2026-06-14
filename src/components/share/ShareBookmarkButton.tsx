import { useNavigate } from 'react-router'
import { Bookmark } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToggleBookmark } from '@/hooks/useShareBookmarks'
import { cn } from '@/lib/utils'
import type { SharePost } from '@/types'

interface ShareBookmarkButtonProps {
  post: SharePost
  showCount?: boolean
}

export const ShareBookmarkButton = ({ post, showCount = true }: ShareBookmarkButtonProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { mutate, isPending } = useToggleBookmark(post.id)

  const handleClick = () => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    mutate(post.isBookmarked)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-black tabular-nums transition-colors disabled:opacity-50',
        post.isBookmarked ? 'text-primary' : 'text-muted-foreground/50 hover:text-foreground',
      )}
      aria-label={post.isBookmarked ? 'ブックマークを外す' : 'ブックマークする'}
      aria-pressed={post.isBookmarked}
    >
      <Bookmark className={cn('h-3.5 w-3.5', post.isBookmarked && 'fill-current')} />
      {showCount && post.bookmarkCount > 0 && <span>{post.bookmarkCount}</span>}
    </button>
  )
}
