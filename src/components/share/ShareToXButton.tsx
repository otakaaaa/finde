import { buildShareTweetText } from '@/components/share/shareTweet'
import type { SharePost } from '@/types'

interface ShareToXButtonProps {
  post: SharePost
}

/** 公開投稿のみ X（旧Twitter）にシェアできる。 */
export const ShareToXButton = ({ post }: ShareToXButtonProps) => {
  if (post.visibility !== 'public' || post.state !== 'published') return null

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/${post.id}`
    const text = buildShareTweetText(post.body)
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(intent, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:border-foreground hover:text-foreground"
      aria-label="Xにシェア"
    >
      {/* X logo */}
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share
    </button>
  )
}
