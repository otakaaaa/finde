import { z } from 'zod'
import {
  businessHoursSchema,
  DEFAULT_HOURS_ENTRY,
  toFormEntry,
} from '@/components/shop/ShopBusinessHoursSection'
import type { BusinessHours, PriceRange } from '@/types'

export const shopFormSchema = z.object({
  name:         z.string().min(1, '店舗名を入力してください').max(100),
  description:  z.string().max(2000, '2000文字以内').optional(),
  prefectureId: z.number({
    required_error:    '都道府県を選択してください',
    invalid_type_error: '都道府県を選択してください',
  }),
  cityId:       z.number().optional(),
  address:      z.string().max(200).optional(),
  priceRangeId: z.number().optional(),
  categoryIds:  z.array(z.number()).min(1, 'カテゴリを1つ以上選択してください'),
  phone:        z.string().max(20).optional(),
  websiteUrl:   z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  instagramUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  twitterUrl:   z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  tiktokUrl:    z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  status:       z.enum(['public', 'private', 'pending']).default('public'),
  businessHours: businessHoursSchema,
})

export type ShopFormValues = z.infer<typeof shopFormSchema>

export const DEFAULT_SHOP_FORM_VALUES: Partial<ShopFormValues> = {
  categoryIds: [],
  status: 'public',
  businessHours: {
    mon: { ...DEFAULT_HOURS_ENTRY },
    tue: { ...DEFAULT_HOURS_ENTRY },
    wed: { ...DEFAULT_HOURS_ENTRY },
    thu: { ...DEFAULT_HOURS_ENTRY },
    fri: { ...DEFAULT_HOURS_ENTRY },
    sat: { ...DEFAULT_HOURS_ENTRY },
    sun: { ...DEFAULT_HOURS_ENTRY },
  },
}

interface ShopSource {
  name: string
  description: string | null
  prefectureId: number | null
  cityId: number | null
  address: string | null
  priceRange: PriceRange | null
  categories: { id: number }[]
  phone: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  tiktokUrl: string | null
  status: ShopFormValues['status']
  businessHours: BusinessHours | null
}

export function shopToFormValues(shop: ShopSource): ShopFormValues {
  const bh = shop.businessHours
  return {
    name:         shop.name,
    description:  shop.description ?? '',
    prefectureId: shop.prefectureId ?? ('' as unknown as number),
    cityId:       shop.cityId ?? undefined,
    address:      shop.address ?? '',
    priceRangeId: shop.priceRange?.id,
    categoryIds:  shop.categories.map((c) => c.id),
    phone:        shop.phone ?? '',
    websiteUrl:   shop.websiteUrl ?? '',
    instagramUrl: shop.instagramUrl ?? '',
    twitterUrl:   shop.twitterUrl ?? '',
    tiktokUrl:    shop.tiktokUrl ?? '',
    status:       shop.status,
    businessHours: {
      mon: toFormEntry(bh?.mon ?? null),
      tue: toFormEntry(bh?.tue ?? null),
      wed: toFormEntry(bh?.wed ?? null),
      thu: toFormEntry(bh?.thu ?? null),
      fri: toFormEntry(bh?.fri ?? null),
      sat: toFormEntry(bh?.sat ?? null),
      sun: toFormEntry(bh?.sun ?? null),
    },
  }
}
