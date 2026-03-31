import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import type { Toast } from '@/store/uiStore'

const DURATION = 4000

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
        'toast-enter relative overflow-hidden border-l-[3px] bg-foreground editorial-shadow',
        'flex w-[300px] items-start gap-3 px-4 py-3.5 sm:w-[340px]',
        isDestructive ? 'border-l-red-500' : 'border-l-emerald-400',
      )}
      role="alert"
    >
      {/* Icon */}
      {isDestructive ? (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="font-headline text-[12px] font-black tracking-wide text-white/90">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-0.5 text-[10px] leading-relaxed text-white/45">
            {toast.description}
          </p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        className="mt-0.5 shrink-0 text-white/20 transition-colors hover:text-white/60"
        aria-label="閉じる"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Progress bar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-[2px] w-full origin-left',
          isDestructive ? 'bg-red-500' : 'bg-emerald-400',
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

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}
