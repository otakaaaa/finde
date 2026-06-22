import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ItemType, SizeGroup } from '@/types'

interface ItemCategoryRow {
  id: number
  code: string
  name: string
  order: number
  size_group: string
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
        supabase.from('item_categories').select('id, code, name, order, size_group').order('order') as unknown as Promise<{ data: ItemCategoryRow[] | null; error: { message: string } | null }>,
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
        sizeGroup: cat.size_group as SizeGroup,
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
