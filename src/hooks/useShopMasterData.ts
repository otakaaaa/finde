import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Area, Brand, Category, City, Prefecture, PriceRange } from '@/types'

interface BrandRow {
  id: string
  name: string
  name_kana: string | null
  aliases: string[]
  status: string
  merged_into: string | null
  submitted_by: string | null
  created_at: string
}

export const useShopMasterData = () =>
  useQuery({
    queryKey: ['master-data'],
    queryFn: async () => {
      const [areas, categories, priceRanges, prefectures, cities, brands] = await Promise.all([
        supabase.from('areas').select('id, prefecture, city, slug').order('id') as unknown as Promise<{ data: Area[] | null; error: { message: string } | null }>,
        supabase.from('categories').select('id, code, name').order('id') as unknown as Promise<{ data: Category[] | null; error: { message: string } | null }>,
        supabase.from('price_ranges').select('id, label, min_price, max_price').order('id') as unknown as Promise<{ data: ({ id: number; label: string; min_price: number | null; max_price: number | null })[] | null; error: { message: string } | null }>,
        supabase.from('prefectures').select('id, name, name_en, region, slug').order('id') as unknown as Promise<{ data: ({ id: number; name: string; name_en: string; region: string; slug: string })[] | null; error: { message: string } | null }>,
        supabase.from('cities').select('id, prefecture_id, name').order('prefecture_id').order('name') as unknown as Promise<{ data: ({ id: number; prefecture_id: number; name: string })[] | null; error: { message: string } | null }>,
        supabase.from('brands').select('id, name, name_kana, aliases, status, merged_into, submitted_by, created_at').eq('status', 'active').order('name') as unknown as Promise<{ data: BrandRow[] | null; error: { message: string } | null }>,
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
        cities: (cities.data ?? []).map((c) => ({
          id: c.id,
          prefectureId: c.prefecture_id,
          name: c.name,
        })) as City[],
        brands: (brands.data ?? []).map((b) => ({
          id: b.id,
          name: b.name,
          nameKana: b.name_kana,
          aliases: b.aliases,
          status: b.status as Brand['status'],
          mergedInto: b.merged_into,
          submittedBy: b.submitted_by,
          createdAt: b.created_at,
        })) as Brand[],
      }
    },
    staleTime: Infinity,
  })
