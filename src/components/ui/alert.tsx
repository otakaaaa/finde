import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4 text-sm',
        variant === 'destructive'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-border bg-muted',
        className
      )}
      {...props}
    />
  )
)
Alert.displayName = 'Alert'

export const AlertDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm', className)} {...props} />
  )
)
AlertDescription.displayName = 'AlertDescription'
