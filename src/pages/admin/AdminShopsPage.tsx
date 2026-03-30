import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ShopRow {
  id: string
  name: string
  status: string
  created_at: string
  areas: { city: string } | null
}

const useAdminShops = (status: string) =>
  useQuery({
    queryKey: ['admin-shops', status],
    queryFn: async () => {
      let query = supabase
        .from('shops')
        .select('id, name, status, created_at, areas ( city )')
        .order('created_at', { ascending: false })
        .limit(50)

      if (status !== 'all') query = query.eq('status', status)

      const { data, error } = await (query as unknown as Promise<{ data: ShopRow[] | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

const AdminShopsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: shops, isLoading } = useAdminShops(statusFilter)

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ shopId, status }: { shopId: string; status: string }) => {
      const { error } = await supabase.from('shops').update({ status } as never).eq('id', shopId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
    },
  })

  const filtered = shops?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">店舗管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/shops/bulk">CSV一括登録</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/shops/new">+ 新規登録</Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="flex gap-1">
          {['all', 'public', 'pending', 'private'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
              }`}
            >
              {s === 'all' ? 'すべて' : s === 'public' ? '公開' : s === 'pending' ? '審査中' : '非公開'}
            </button>
          ))}
        </div>
        <Input
          placeholder="店舗名で絞り込み"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-48"
        />
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
              <th className="px-4 py-3 text-left font-medium">店舗名</th>
              <th className="px-4 py-3 text-left font-medium">エリア</th>
              <th className="px-4 py-3 text-left font-medium">ステータス</th>
              <th className="px-4 py-3 text-left font-medium">登録日</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((shop) => (
              <tr key={shop.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link to={`/shops/${shop.id}`} className="hover:underline text-primary">
                    {shop.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {shop.areas?.city ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    shop.status === 'public' ? 'bg-green-50 text-green-700'
                      : shop.status === 'pending' ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {shop.status === 'public' ? '公開' : shop.status === 'pending' ? '審査中' : '非公開'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(shop.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/admin/shops/${shop.id}/edit`}>編集</Link>
                    </Button>
                    {shop.status !== 'public' && (
                      <Button size="sm" onClick={() => updateStatus({ shopId: shop.id, status: 'public' })}>
                        公開
                      </Button>
                    )}
                    {shop.status !== 'private' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus({ shopId: shop.id, status: 'private' })}>
                        非公開
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            店舗が見つかりません
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminShopsPage
