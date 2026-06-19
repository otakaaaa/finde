import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Size, SizeGroup } from '@/types'

interface SizeRow {
  id: number
  code: string
  label: string
  size_group: string
  order: number
}

export const useSizes = () =>
  useQuery({
    queryKey: ['sizes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sizes')
        .select('id, code, label, size_group, order')
        .order('order') as unknown as { data: SizeRow[] | null; error: { message: string } | null }
      if (error) throw new Error(error.message)

      const all: Size[] = (data ?? []).map((r) => ({
        id: r.id,
        code: r.code,
        label: r.label,
        sizeGroup: r.size_group as SizeGroup,
        order: r.order,
      }))

      const bySizeGroup = all.reduce<Partial<Record<SizeGroup, Size[]>>>((acc, s) => {
        if (!acc[s.sizeGroup]) acc[s.sizeGroup] = []
        acc[s.sizeGroup]!.push(s)
        return acc
      }, {})

      return { all, bySizeGroup: bySizeGroup as Record<SizeGroup, Size[]> }
    },
    staleTime: Infinity,
  })
