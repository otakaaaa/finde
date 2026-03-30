import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface ReviewReportRow {
  id: string
  reason: string
  created_at: string
  reviews: {
    id: string
    body: string
    rating: number
    status: string
    ng_score: number
    shops: { id: string; name: string } | null
    users: { id: string; display_name: string | null } | null
  }
}

const useReviewReports = () =>
  useQuery({
    queryKey: ['admin-review-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_reports')
        .select(`
          id, reason, created_at,
          reviews (
            id, body, rating, status, ng_score,
            shops ( id, name ),
            users ( id, display_name )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50) as { data: ReviewReportRow[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

const REASON_LABEL: Record<string, string> = {
  false_info: '虚偽情報',
  harassment: 'ハラスメント',
  irrelevant: '無関係な内容',
  other: 'その他',
}

const AdminReviewsPage = () => {
  const queryClient = useQueryClient()
  const { data: reports, isLoading } = useReviewReports()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const { mutate: updateReviewStatus } = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string; status: string }) => {
      const { error } = await supabase.from('reviews').update({ status } as never).eq('id', reviewId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-review-reports'] })
      setProcessingId(null)
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">レビュー管理</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && reports?.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          通報されたレビューはありません
        </div>
      )}

      <div className="space-y-4">
        {reports?.map((report) => (
          <div key={report.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-orange-600 bg-orange-50 rounded px-1.5 py-0.5">
                  通報理由: {REASON_LABEL[report.reason] ?? report.reason}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  店舗: {report.reviews.shops?.name ?? '不明'} ·
                  投稿者: {report.reviews.users?.display_name ?? '匿名'} ·
                  評価: {report.reviews.rating}/5 ·
                  NGスコア: {report.reviews.ng_score}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs shrink-0 ${
                report.reviews.status === 'published' ? 'bg-green-50 text-green-700'
                  : report.reviews.status === 'flagged' ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {report.reviews.status === 'published' ? '公開中'
                  : report.reviews.status === 'flagged' ? 'フラグ済'
                  : '非表示'}
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-3">{report.reviews.body}</p>

            <div className="mt-3 flex gap-2">
              {report.reviews.status !== 'hidden' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setProcessingId(report.reviews.id)
                    updateReviewStatus({ reviewId: report.reviews.id, status: 'hidden' })
                  }}
                  disabled={processingId === report.reviews.id}
                >
                  非表示にする
                </Button>
              )}
              {report.reviews.status !== 'published' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setProcessingId(report.reviews.id)
                    updateReviewStatus({ reviewId: report.reviews.id, status: 'published' })
                  }}
                  disabled={processingId === report.reviews.id}
                >
                  公開に戻す
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminReviewsPage
