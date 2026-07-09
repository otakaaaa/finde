import { Navigate, Link, useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft } from 'lucide-react'
import { usePressRelease } from '@/hooks/usePressReleases'

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: item, isLoading, isError } = usePressRelease(id ?? '')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 md:px-16">
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-1/4 animate-pulse rounded-sm bg-muted" />
          <div className="mt-8 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded-sm bg-muted" style={{ animationDelay: `${i * 40}ms` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || item == null) {
    return <Navigate to="/news" replace />
  }

  return (
    <div className="bg-background">
      {/* SEOメタはルートの meta エクスポート（routes/news-detail.tsx）が出力する */}
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-16 md:py-16">
        {/* Back link */}
        <Link
          to="/news"
          className="mb-8 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          お知らせ一覧へ
        </Link>

        {/* Header */}
        <div className="mb-10 border-b border-border pb-8">
          <time className="mb-3 block font-headline text-[11px] font-black tabular-nums tracking-wider text-muted-foreground/40">
            {formatDate(item.publishedAt!)}
          </time>
          <h1 className="font-headline text-2xl font-black leading-tight tracking-tight text-foreground md:text-3xl">
            {item.title}
          </h1>
        </div>

        {/* Body */}
        <div className="news-prose">
          <ReactMarkdown>{item.body}</ReactMarkdown>
        </div>

        {/* Footer back link */}
        <div className="mt-14 border-t border-border pt-8">
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            お知らせ一覧へ
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NewsDetailPage
