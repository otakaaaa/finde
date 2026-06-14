import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { PenLine } from 'lucide-react'
import { useShareTimeline } from '@/hooks/useShareTimeline'
import { SharePostCard } from '@/components/share/SharePostCard'
import { Seo } from '@/components/seo/Seo'
import { cn } from '@/lib/utils'
import type { ShareTimelineTab } from '@/types'

const TABS: { value: ShareTimelineTab; label: string }[] = [
  { value: 'hot', label: 'おすすめ' },
  { value: 'recent', label: '新着' },
]

const ShareTimelinePage = () => {
  const [tab, setTab] = useState<ShareTimelineTab>('hot')
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useShareTimeline(tab)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const posts = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div>
      <Seo title="シャレ活" description="ユーザーのおしゃれな投稿（シャレ活）を見て、シャレ度を送り合おう。" path="/share" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            SHARE
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl pb-8">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Share</p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">シャレ活</h1>
        </div>
      </section>

      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-10">
          {/* Tabs + Post button */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={cn(
                    'px-4 py-2 font-headline text-[11px] font-black uppercase tracking-[0.2em] transition-colors',
                    tab === t.value ? 'text-foreground' : 'text-muted-foreground/40 hover:text-muted-foreground/70',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Link
              to="/share/new"
              className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
            >
              <PenLine className="h-3.5 w-3.5" />
              投稿する
            </Link>
          </div>

          {/* Feed */}
          {isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground/40">読み込み中…</p>
          ) : posts.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground/40">まだ投稿がありません。最初のシャレ活を投稿しましょう。</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <SharePostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-8" />
          {isFetchingNextPage && (
            <p className="py-4 text-center text-[11px] text-muted-foreground/40">読み込み中…</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareTimelinePage
