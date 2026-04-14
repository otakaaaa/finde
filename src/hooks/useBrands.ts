import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Brand } from '@/types'

interface BrandRow {
  id: string
  name: string
  name_kana: string | null
  aliases: string[]
  status: 'active' | 'merged'
}

const mapBrand = (b: BrandRow): Brand => ({
  id: b.id,
  name: b.name,
  nameKana: b.name_kana,
  aliases: b.aliases,
  status: b.status,
  mergedInto: null,
  submittedBy: null,
  createdAt: '',
})

export const useBrands = () =>
  useQuery({
    queryKey: ['brands-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status')
        .eq('status', 'active')
        .order('name') as unknown as { data: BrandRow[] | null; error: unknown }
      return (data ?? []).map(mapBrand)
    },
    staleTime: 10 * 60 * 1000,
  })

export const useSearchBrands = (committedQuery: string) =>
  useQuery({
    queryKey: ['brands-search', committedQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status')
        .eq('status', 'active')
        .ilike('name', `%${committedQuery}%`)
        .order('name')
        .limit(10) as unknown as { data: BrandRow[] | null; error: unknown }
      return (data ?? []).map(mapBrand)
    },
    enabled: committedQuery.trim().length >= 1,
    staleTime: 30 * 1000,
  })

