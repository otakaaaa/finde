import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface ListingRequestRow {
  id: string
  shop_name: string
  address: string | null
  website_url: string | null
  note: string | null
  is_owner_request: boolean
  status: string
  created_at: string
  users: { id: string; display_name: string | null } | null
}

const useListingRequests = (status: string) =>
  useQuery({
    queryKey: ['admin-listing-requests', status],
    queryFn: async () => {
      let query = supabase
        .from('shop_listing_requests')
        .select('id, shop_name, address, website_url, note, is_owner_request, status, created_at, users:submitted_by ( id, display_name )')
        .order('created_at', { ascending: false })
        .limit(50)

      if (status !== 'all') query = query.eq('status', status)

      const { data, error } = query as unknown as { data: ListingRequestRow[] | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

const AdminApplicationsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')

  const { data: requests, isLoading } = useListingRequests(statusFilter)

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      const { error } = await supabase
        .from('shop_listing_requests')
        .update({ status } as never)
        .eq('id', requestId) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listing-requests'] })
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">掲載申請管理</h1>

      <div className="mb-4 flex gap-1">
        {['all', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              statusFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
            }`}
          >
            {s === 'all' ? 'すべて' : s === 'pending' ? '審査中' : s === 'approved' ? '承認済' : '却下'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && requests?.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">申請が見つかりません</div>
      )}

      <div className="space-y-4">
        {requests?.map((req) => (
          <div key={req.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold">{req.shop_name}</h2>
                  {req.is_owner_request && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      オーナー申請
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    req.status === 'pending' ? 'bg-yellow-50 text-yellow-700'
                      : req.status === 'approved' ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {req.status === 'pending' ? '審査中' : req.status === 'approved' ? '承認済' : '却下'}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground space-y-0.5">
                  {req.address && <p>住所: {req.address}</p>}
                  {req.website_url && <p>サイト: {req.website_url}</p>}
                  {req.note && <p>備考: {req.note}</p>}
                  <p>申請者: {req.users?.display_name ?? '不明'} · {new Date(req.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => updateStatus({ requestId: req.id, status: 'approved' })}
                  >
                    承認
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus({ requestId: req.id, status: 'rejected' })}
                  >
                    却下
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminApplicationsPage
