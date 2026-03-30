import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Search, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Brand } from '@/types'

interface ShopBrandRow {
  brands: Brand & { name_kana: string | null; merged_into: string | null; submitted_by: string | null; created_at: string }
}

const useShopBrands = (shopId: string) =>
  useQuery({
    queryKey: ['shop-brands', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_brands')
        .select('brands ( id, name, name_kana, aliases, status, merged_into, submitted_by, created_at )')
        .eq('shop_id', shopId) as { data: ShopBrandRow[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return (data ?? []).map(({ brands: b }) => ({
        id: b.id,
        name: b.name,
        nameKana: b.name_kana,
        aliases: b.aliases,
        status: b.status,
        mergedInto: b.merged_into,
        submittedBy: b.submitted_by,
        createdAt: b.created_at,
      })) as Brand[]
    },
    enabled: !!shopId,
  })

const useSearchBrands = (query: string) =>
  useQuery({
    queryKey: ['brands-search', query],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status, merged_into, submitted_by, created_at')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)
        .limit(10) as { data: (Omit<Brand, 'nameKana' | 'mergedInto' | 'submittedBy' | 'createdAt'> & { name_kana: string | null; merged_into: string | null; submitted_by: string | null; created_at: string })[] | null; error: unknown }

      return (data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        nameKana: b.name_kana,
        aliases: b.aliases,
        status: b.status,
        mergedInto: b.merged_into,
        submittedBy: b.submitted_by,
        createdAt: b.created_at,
      })) as Brand[]
    },
    enabled: query.trim().length >= 2,
  })

const BrandsManagePage = () => {
  const { id: shopId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: shopBrands, isLoading } = useShopBrands(shopId ?? '')
  const { data: searchResults } = useSearchBrands(searchQuery)

  const { mutate: addBrand, isPending: isAdding } = useMutation({
    mutationFn: async (brandId: string) => {
      const { error } = await supabase
        .from('shop_brands')
        .insert({ shop_id: shopId, brand_id: brandId } as never) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-brands', shopId] })
      setSearchQuery('')
    },
    onError: (err: Error) => setError(err.message),
  })

  const { mutate: removeBrand } = useMutation({
    mutationFn: async (brandId: string) => {
      const { error } = await supabase
        .from('shop_brands')
        .delete()
        .eq('shop_id', shopId ?? '')
        .eq('brand_id', brandId)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-brands', shopId] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const { mutate: addNewBrand, isPending: isCreating } = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('ログインが必要です')

      const { data, error } = await supabase
        .from('brands')
        .insert({ name, submitted_by: user.id, status: 'active' } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      if (!data) throw new Error('ブランドの作成に失敗しました')

      await supabase.from('shop_brands').insert({ shop_id: shopId, brand_id: data.id } as never)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-brands', shopId] })
      setSearchQuery('')
    },
    onError: (err: Error) => setError(err.message),
  })

  const existingBrandIds = new Set(shopBrands?.map((b) => b.id) ?? [])
  const filteredResults = searchResults?.filter((b) => !existingBrandIds.has(b.id)) ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to={`/owner/shops/${shopId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        店舗編集へ戻る
      </Link>

      <h1 className="mb-6 text-2xl font-bold">ブランド管理</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search / Add */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ブランド名で検索して追加"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {searchQuery.trim().length >= 2 && (
          <div className="mt-2 rounded-md border bg-white shadow-sm">
            {filteredResults.length > 0 ? (
              filteredResults.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => addBrand(brand.id)}
                  disabled={isAdding}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted"
                >
                  <span>{brand.name}</span>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                「{searchQuery}」は見つかりませんでした。
                <button
                  onClick={() => addNewBrand(searchQuery.trim())}
                  disabled={isCreating}
                  className="ml-1 text-primary hover:underline"
                >
                  新しく追加する
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current brands */}
      <h2 className="mb-3 font-medium">登録済みブランド ({shopBrands?.length ?? 0}件)</h2>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && shopBrands?.length === 0 && (
        <p className="text-sm text-muted-foreground">ブランドが登録されていません</p>
      )}

      <div className="flex flex-wrap gap-2">
        {shopBrands?.map((brand) => (
          <div
            key={brand.id}
            className="flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-sm"
          >
            <span>{brand.name}</span>
            <button
              onClick={() => removeBrand(brand.id)}
              className="ml-1 text-muted-foreground hover:text-red-500"
              title="削除"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BrandsManagePage
