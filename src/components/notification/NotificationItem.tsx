import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@/lib/timeago'
import { NOTIFICATION_CONFIG } from '@/lib/notificationConfig'
import type { Notification } from '@/types'

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onClose: () => void
}

export const NotificationItem = ({ notification, onRead, onClose }: NotificationItemProps) => {
  const navigate = useNavigate()
  const config = NOTIFICATION_CONFIG[notification.type]
  const Icon = config.icon

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id)
    }
    if (notification.linkUrl) {
      navigate(notification.linkUrl)
    }
    onClose()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left',
        'transition-colors duration-100 last:border-0',
        notification.isRead
          ? 'bg-white hover:bg-muted/30'
          : 'bg-primary/[0.03] hover:bg-primary/[0.06]',
      )}
    >
      {/* アイコン */}
      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm', config.bgClass)}>
        <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
      </span>

      {/* 本文 */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-[11px] leading-snug',
          notification.isRead ? 'font-medium text-foreground/70' : 'font-bold text-foreground',
        )}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground/60">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-[9px] tabular-nums text-muted-foreground/40">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* 未読インジケーター */}
      {!notification.isRead && (
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  )
}
