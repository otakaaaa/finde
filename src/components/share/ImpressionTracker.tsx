import { useEffect, useRef } from 'react'
import { useRecordImpression } from '@/hooks/useShareImpression'

interface ImpressionTrackerProps {
  postId: string
  children: React.ReactNode
}

/** 子要素が初めてビューポートに入ったタイミングでインプレッションを記録する。 */
export const ImpressionTracker = ({ postId, children }: ImpressionTrackerProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const record = useRecordImpression()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            record(postId)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [postId, record])

  return <div ref={ref}>{children}</div>
}
