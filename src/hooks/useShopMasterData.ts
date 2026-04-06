import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Area, Category, Prefecture, PriceRange } from '@/types'

export const useShopMasterData = () =>
  useQuery({
    queryKey: ['master-data'],
    queryFn: async () => {
      const [areas, categories, priceRanges, prefectures] = await Promise.all([
        supabase.from('areas').select('id, prefecture, city, slug').order('id') as unknown as Promise<{ data: Area[] | null; error: { message: string } | null }>,
        supabase.from('categories').select('id, code, name').order('id') as unknown as Promise<{ data: Category[] | null; error: { message: string } | null }>,
        supabase.from('price_ranges').select('id, label, min_price, max_price').order('id') as unknown as Promise<{ data: ({ id: number; label: string; min_price: number | null; max_price: number | null })[] | null; error: { message: string } | null }>,
        supabase.from('prefectures').select('id, name, name_en, region, slug').order('id') as unknown as Promise<{ data: ({ id: number; name: string; name_en: string; region: string; slug: string })[] | null; error: { message: string } | null }>,
      ])
      return {
        areas: areas.data ?? [],
        categories: categories.data ?? [],
        priceRanges: (priceRanges.data ?? []).map((p) => ({
          id: p.id,
          label: p.label,
          minPrice: p.min_price,
          maxPrice: p.max_price,
        })) as PriceRange[],
        prefectures: (prefectures.data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          nameEn: p.name_en,
          region: p.region,
          slug: p.slug,
        })) as Prefecture[],
      }
    },
    staleTime: Infinity,
  })
