import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationPanel } from './NotificationPanel'

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, isMarkingAll } = useNotifications()

  // パネル外クリックで閉じる
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const handleOpen = () => setIsOpen((v) => !v)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="通知"
        aria-expanded={isOpen}
        className={cn(
          'relative flex h-7 w-7 items-center justify-center rounded-sm transition-colors duration-150',
          isOpen
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground/50 hover:text-foreground',
        )}
      >
        <Bell className="h-4 w-4" />

        {/* 未読バッジ */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 font-headline text-[8px] font-black tabular-nums leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          isLoading={isLoading}
          isMarkingAll={isMarkingAll}
          unreadCount={unreadCount}
          onRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
