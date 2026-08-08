import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeft, CheckCheck, ExternalLink } from 'lucide-react'
import { usePaginatedNotifications } from '@/hooks/useNotifications'
import { NOTIFICATION_CONFIG } from '@/lib/notificationConfig'
import { formatTimeAgo } from '@/lib/timeago'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'
import type { PageSizeOption } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { NotificationSettingsPanel } from '@/components/notification/NotificationSettingsPanel'

// ── Notification List Item (wide layout) ─────────────────────

interface NotificationListItemProps {
  notification: Notification
  onRead: (id: string) => void
}

const NotificationListItem = ({ notification, onRead }: NotificationListItemProps) => {
  const navigate = useNavigate()
  const config = NOTIFICATION_CONFIG[notification.type]
  const Icon = config.icon

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id)
    if (notification.linkUrl) navigate(notification.linkUrl)
  }

  return (
    <div
      className={cn(
        'wish-card-enter group relative border-l-[3px] transition-colors duration-100',
        notification.isRead
          ? 'border-l-border bg-white hover:bg-muted/20'
          : 'border-l-primary bg-primary/[0.025] hover:bg-primary/[0.05]',
      )}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        {/* アイコン */}
        <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm', config.bgClass)}>
          <Icon className={cn('h-4 w-4', config.iconClass)} />
        </span>

        {/* 本文 */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className={cn(
                'text-[13px] leading-snug',
                notification.isRead ? 'font-medium text-foreground/70' : 'font-bold text-foreground',
              )}>
                {notification.title}
              </p>
              {notification.body && (
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/60">
                  {notification.body}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="tabular-nums text-[10px] text-muted-foreground/35">
                {formatTimeAgo(notification.createdAt)}
              </span>
              {!notification.isRead && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          </div>

          {/* タイプバッジ + リンク */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn(
              'rounded-sm px-1.5 py-0.5 font-headline text-[8px] font-black uppercase tracking-wider',
              config.bgClass,
              config.iconClass,
            )}>
              {config.label}
            </span>
            {notification.linkUrl && (
              <button
                type="button"
                onClick={handleClick}
                className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground/50 transition-colors hover:text-primary"
              >
                詳細を見る
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 未読 → クリックで既読にする（リンクなし通知） */}
      {!notification.isRead && !notification.linkUrl && (
        <button
          type="button"
          onClick={() => onRead(notification.id)}
          className="absolute inset-0 cursor-pointer"
          aria-label="既読にする"
        />
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

const NotificationsPage = () => {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(20)

  useEffect(() => { setPage(1) }, [unreadOnly, pageSize])

  const { items, totalCount, isLoading, markAsRead, markAllAsRead, isMarkingAll } =
    usePaginatedNotifications(unreadOnly, page, pageSize)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const unreadInPage = items.filter((n) => !n.isRead).length

  return (
    <div>
      {/* ── Page header ────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            INBOX
          </span>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="pb-6">
            <Link
              to="/mypage"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 transition-colors hover:text-foreground/60"
            >
              <ChevronLeft className="h-3 w-3" />
              マイページ
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">— Mypage</p>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
                  通知
                </h1>
              </div>
              {unreadInPage > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1.5 rounded-sm border border-border bg-foreground/10 px-3 py-2 font-headline text-[9px] font-black uppercase tracking-wider text-foreground/70 transition-colors hover:bg-foreground/20 disabled:opacity-40"
                >
                  {isMarkingAll
                    ? <span className="h-3 w-3 animate-spin rounded-full border border-border border-t-white" />
                    : <CheckCheck className="h-3 w-3" />
                  }
                  すべて既読にする
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-16 md:py-10">

          {/* 受信設定 */}
          <div className="mb-8">
            <NotificationSettingsPanel />
          </div>

          {/* Filter */}
          <div className="mb-6 flex items-center gap-2">
            {(
              [
                { value: false, label: 'すべて' },
                { value: true,  label: '未読のみ' },
              ] as const
            ).map((f) => (
              <button
                key={String(f.value)}
                onClick={() => setUnreadOnly(f.value)}
                className={cn(
                  'rounded-sm border px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-wider transition-all',
                  unreadOnly === f.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                )}
              >
                {f.label}
              </button>
            ))}
            {!isLoading && (
              <span className="ml-1 tabular-nums text-[10px] text-muted-foreground/40">
                {totalCount} 件
              </span>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && items.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                No Notifications
              </span>
              <p className="text-xs text-muted-foreground/40">
                {unreadOnly ? '未読の通知はありません' : '通知はありません'}
              </p>
            </div>
          )}

          {/* List */}
          {!isLoading && items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((n, i) => (
                <div key={n.id} style={{ animationDelay: `${i * 20}ms` }}>
                  <NotificationListItem notification={n} onRead={markAsRead} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default NotificationsPage
