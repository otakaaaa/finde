import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { ShareComments } from '@/components/share/ShareComments'
import { cn } from '@/lib/utils'

interface ShareCommentSheetProps {
  postId: string
  commentCount: number
  isOpen: boolean
  onClose: () => void
}

export const ShareCommentSheet = ({ postId, commentCount, isOpen, onClose }: ShareCommentSheetProps) => {
  const [mounted, setMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) setMounted(true)
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-3 pt-1">
          <span className="font-headline text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
            コメント{commentCount > 0 ? ` (${commentCount})` : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-muted-foreground/40 transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-4">
          <ShareComments postId={postId} />
        </div>
      </div>
    </>,
    document.body,
  )
}
