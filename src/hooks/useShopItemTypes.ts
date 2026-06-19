import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ItemType } from '@/types'

interface ItemTypeWithCategory extends ItemType {
  itemCategoryName: string
}

interface ShopItemTypeRow {
  item_type_id: number
}

// 店舗が登録しているアイテムタイプ ID セット
export const useShopItemTypeIds = (shopId: string) =>
  useQuery({
    queryKey: ['shop-item-types', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_item_types')
        .select('item_type_id')
        .eq('shop_id', shopId) as unknown as { data: ShopItemTypeRow[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return new Set((data ?? []).map((r) => r.item_type_id))
    },
    enabled: !!shopId,
  })

interface ItemCategoryRow {
  id: number
  code: string
  name: string
  order: number
}

interface ItemTypeRow {
  id: number
  item_category_id: number
  code: string
  name: string
  order: number
}

// カテゴリ + アイテムタイプのマスタ一覧
export const useItemCategoriesWithTypes = () =>
  useQuery({
    queryKey: ['item-categories-with-types'],
    queryFn: async () => {
      const [catResult, typeResult] = await Promise.all([
        supabase.from('item_categories').select('id, code, name, order').order('order') as unknown as Promise<{ data: ItemCategoryRow[] | null; error: { message: string } | null }>,
        supabase.from('item_types').select('id, item_category_id, code, name, order').order('order') as unknown as Promise<{ data: ItemTypeRow[] | null; error: { message: string } | null }>,
      ])

      if (catResult.error) throw new Error(catResult.error.message)
      if (typeResult.error) throw new Error(typeResult.error.message)

      const categories = catResult.data ?? []
      const types = typeResult.data ?? []

      return categories.map((cat) => ({
        id: cat.id,
        code: cat.code,
        name: cat.name,
        order: cat.order,
        types: types
          .filter((t) => t.item_category_id === cat.id)
          .map((t) => ({
            id: t.id,
            itemCategoryId: t.item_category_id,
            code: t.code,
            name: t.name,
            order: t.order,
          } as ItemType)),
      }))
    },
    staleTime: Infinity,
  })

// アイテムタイプをトグル（追加 or 削除）
export const useToggleShopItemType = (shopId: string) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ itemTypeId, checked }: { itemTypeId: number; checked: boolean }) => {
      if (!user) throw new Error('ログインが必要です')

      if (checked) {
        const { error } = await supabase
          .from('shop_item_types')
          .insert({ shop_id: shopId, item_type_id: itemTypeId } as never) as unknown as { error: { message: string } | null }
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('shop_item_types')
          .delete()
          .eq('shop_id', shopId)
          .eq('item_type_id', itemTypeId) as unknown as { error: { message: string } | null }
        if (error) throw new Error(error.message)
      }
    },
    onMutate: async ({ itemTypeId, checked }) => {
      await queryClient.cancelQueries({ queryKey: ['shop-item-types', shopId] })
      const prev = queryClient.getQueryData<Set<number>>(['shop-item-types', shopId])

      queryClient.setQueryData<Set<number>>(['shop-item-types', shopId], (old) => {
        const next = new Set(old)
        if (checked) next.add(itemTypeId)
        else next.delete(itemTypeId)
        return next
      })

      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['shop-item-types', shopId], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-item-types', shopId] })
    },
  })
}

export type { ItemTypeWithCategory }
