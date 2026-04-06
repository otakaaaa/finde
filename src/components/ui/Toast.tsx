import { useEffect } from 'react'
import { Check, AlertCircle, X } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import type { Toast, ToastPosition } from '@/store/uiStore'

const DURATION = 4000

const TOAST_STACK_CLASSNAME: Record<ToastPosition, string> = {
  'top-center': 'left-1/2 top-4 -translate-x-1/2 items-center sm:top-6',
  'top-right': 'right-4 top-4 items-end sm:right-6 sm:top-6',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center sm:bottom-6',
  'bottom-right': 'bottom-4 right-4 items-end sm:bottom-6 sm:right-6',
}

// ── Single toast item ──────────────────────────────────────────

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), DURATION)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const isDestructive = toast.variant === 'destructive'

  return (
    <div
      className={cn(
        'wish-card-enter relative overflow-hidden border-l-[3px] bg-white editorial-shadow',
        'flex w-[300px] items-center gap-3 px-5 py-3.5 sm:w-[340px]',
        isDestructive ? 'border-l-red-400' : 'border-l-emerald-400',
      )}
      role="alert"
    >
      {/* Icon */}
      {isDestructive ? (
        <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
      ) : (
        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-[12px] font-medium',
          isDestructive ? 'text-red-700' : 'text-emerald-700',
        )}>
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/60">
            {toast.description}
          </p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-muted-foreground/30 transition-colors hover:text-muted-foreground/70"
        aria-label="閉じる"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Progress bar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-[2px] w-full origin-left',
          isDestructive ? 'bg-red-400' : 'bg-emerald-400',
        )}
        style={{ animation: `toast-progress ${DURATION}ms linear forwards` }}
      />
    </div>
  )
}

// ── Toast stack ────────────────────────────────────────────────

export const ToastStack = () => {
  const { toasts, removeToast } = useUiStore()

  if (toasts.length === 0) return null

  const positions: ToastPosition[] = ['top-center', 'top-right', 'bottom-center', 'bottom-right']

  return (
    <>
      {positions.map((position) => {
        const groupedToasts = toasts.filter((toast) => toast.position === position)

        if (groupedToasts.length === 0) return null

        return (
          <div
            key={position}
            className={cn(
              'pointer-events-none fixed z-[200] flex flex-col gap-2',
              TOAST_STACK_CLASSNAME[position],
            )}
            aria-live="polite"
          >
            {groupedToasts.map((toast) => (
              <div key={toast.id} className="pointer-events-auto">
                <ToastItem toast={toast} onRemove={removeToast} />
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}
