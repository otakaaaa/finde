import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface SubscriptionRow {
  id: string
  plan: string
  status: string
  current_period_end: string | null
  created_at: string
  shops: { id: string; name: string } | null
  users: { id: string; display_name: string | null } | null
}

const useAdminSubscriptions = () =>
  useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id, plan, status, current_period_end, created_at,
          shops ( id, name ),
          users:user_id ( id, display_name )
        `)
        .order('created_at', { ascending: false })
        .limit(100) as { data: SubscriptionRow[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: 'アクティブ', className: 'bg-green-50 text-green-700' },
  canceled: { label: 'キャンセル済', className: 'bg-muted text-muted-foreground' },
  past_due: { label: '支払い遅延', className: 'bg-red-50 text-red-700' },
  trialing: { label: 'トライアル', className: 'bg-blue-50 text-blue-700' },
}

const AdminSubscriptionsPage = () => {
  const { data: subscriptions, isLoading } = useAdminSubscriptions()

  const activeCount = subscriptions?.filter((s) => s.status === 'active').length ?? 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">サブスクリプション管理</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">アクティブ</p>
          <p className="mt-1 text-2xl font-bold">{activeCount}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">合計</p>
          <p className="mt-1 text-2xl font-bold">{subscriptions?.length ?? 0}</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">店舗</th>
              <th className="px-4 py-3 text-left font-medium">オーナー</th>
              <th className="px-4 py-3 text-left font-medium">プラン</th>
              <th className="px-4 py-3 text-left font-medium">ステータス</th>
              <th className="px-4 py-3 text-left font-medium">次回更新日</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions?.map((sub) => {
              const statusInfo = STATUS_LABEL[sub.status] ?? { label: sub.status, className: 'bg-muted text-muted-foreground' }
              return (
                <tr key={sub.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">{sub.shops?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {sub.users?.display_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {sub.plan === 'monthly' ? '月額' : '年額'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString('ja-JP')
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {subscriptions?.length === 0 && !isLoading && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            サブスクリプションがありません
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSubscriptionsPage
