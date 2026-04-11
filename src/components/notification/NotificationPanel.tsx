import { Bell } from 'lucide-react'
import { Link } from 'react-router'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@/types'

interface NotificationPanelProps {
  notifications: Notification[]
  isLoading: boolean
  isMarkingAll: boolean
  unreadCount: number
  onRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClose: () => void
}

export const NotificationPanel = ({
  notifications,
  isLoading,
  isMarkingAll,
  unreadCount,
  onRead,
  onMarkAllAsRead,
  onClose,
}: NotificationPanelProps) => {
  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-4rem)] overflow-hidden border border-border bg-white shadow-lg editorial-shadow"
      // パネル内クリックは親の閉じる処理に伝播させない
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-headline text-[11px] font-black uppercase tracking-[0.2em] text-foreground/70">
            通知
          </span>
          {unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-sm bg-primary px-1 font-headline text-[9px] font-black tabular-nums text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAll}
            className="text-[9px] font-bold text-muted-foreground/50 transition-colors hover:text-primary disabled:opacity-40"
          >
            すべて既読にする
          </button>
        )}
      </div>

      {/* 通知リスト */}
      <div className="max-h-[360px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0"
              >
                <div className="h-7 w-7 animate-pulse rounded-sm bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded-sm bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
                  <div className="h-2.5 w-1/2 animate-pulse rounded-sm bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Bell className="h-6 w-6 text-muted-foreground/20" />
            <p className="text-[11px] text-muted-foreground/40">通知はありません</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={onRead}
              onClose={onClose}
            />
          ))
        )}
      </div>

      {/* フッター */}
      <div className="border-t border-border/50 px-4 py-2 text-center">
        <Link
          to="/mypage/notifications"
          onClick={onClose}
          className="text-[9px] font-medium text-muted-foreground/40 transition-colors hover:text-primary"
        >
          すべての通知を見る →
        </Link>
      </div>
    </div>
  )
}
