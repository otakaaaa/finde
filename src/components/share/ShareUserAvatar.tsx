import { cn } from '@/lib/utils'

const SIZES = {
  sm: { box: 'h-6 w-6', text: 'text-[10px]' },
  md: { box: 'h-7 w-7', text: 'text-[11px]' },
  lg: { box: 'h-9 w-9', text: 'text-[13px]' },
} as const

interface ShareUserAvatarProps {
  displayName: string | null
  avatarUrl: string | null
  size?: keyof typeof SIZES
  className?: string
}

/** シャレ活の投稿者・コメント投稿者のアバター。プロフィール画像がなければ頭文字を表示する。 */
export const ShareUserAvatar = ({ displayName, avatarUrl, size = 'md', className }: ShareUserAvatarProps) => {
  const s = SIZES[size]

  if (avatarUrl) {
    return (
      <div className={cn('shrink-0 overflow-hidden rounded-sm bg-muted', s.box, className)}>
        <img src={avatarUrl} alt={displayName ?? ''} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-sm bg-muted font-headline font-black text-muted-foreground/60',
        s.box,
        s.text,
        className,
      )}
    >
      {displayName?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}
