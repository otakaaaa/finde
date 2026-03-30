import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BrandRow {
  id: string
  name: string
  name_kana: string | null
  status: string
  submitted_by: string | null
  created_at: string
  users: { display_name: string | null } | null
}

const useAdminBrands = (status: string) =>
  useQuery({
    queryKey: ['admin-brands', status],
    queryFn: async () => {
      let query = supabase
        .from('brands')
        .select('id, name, name_kana, status, submitted_by, created_at, users ( display_name )')
        .order('created_at', { ascending: false })
        .limit(100)

      if (status !== 'all') query = query.eq('status', status)

      const { data, error } = query as unknown as { data: BrandRow[] | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

const AdminBrandsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('active')
  const [search, setSearch] = useState('')

  const { data: brands, isLoading } = useAdminBrands(statusFilter)

  const { mutate: updateBrandStatus } = useMutation({
    mutationFn: async ({ brandId, status }: { brandId: string; status: string }) => {
      const { error } = await supabase.from('brands').update({ status } as never).eq('id', brandId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
    },
  })

  const filtered = brands?.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">ブランド管理</h1>

      <div className="mb-4 flex gap-2">
        <div className="flex gap-1">
          {['all', 'active', 'merged'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'
              }`}
            >
              {s === 'all' ? 'すべて' : s === 'active' ? '有効' : 'マージ済'}
            </button>
          ))}
        </div>
        <Input
          placeholder="ブランド名で絞り込み"
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
              <th className="px-4 py-3 text-left font-medium">ブランド名</th>
              <th className="px-4 py-3 text-left font-medium">カナ</th>
              <th className="px-4 py-3 text-left font-medium">投稿者</th>
              <th className="px-4 py-3 text-left font-medium">ステータス</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((brand) => (
              <tr key={brand.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{brand.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{brand.name_kana ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {brand.users?.display_name ?? '管理者'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    brand.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {brand.status === 'active' ? '有効' : 'マージ済'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {brand.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBrandStatus({ brandId: brand.id, status: 'merged' })}
                    >
                      マージ済にする
                    </Button>
                  )}
                  {brand.status === 'merged' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBrandStatus({ brandId: brand.id, status: 'active' })}
                    >
                      有効に戻す
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && (
          <div className="py-8 text-center text-muted-foreground text-sm">ブランドが見つかりません</div>
        )}
      </div>
    </div>
  )
}

export default AdminBrandsPage
