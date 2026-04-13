import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useShopMasterData } from '@/hooks/useShopMasterData'
import { ShopForm } from '@/components/shop/form/ShopForm'
import { ShopPhotoNewSection } from '@/components/shop/ShopPhotoNewSection'
import {
  shopFormSchema,
  DEFAULT_SHOP_FORM_VALUES,
  type ShopFormValues,
} from '@/components/shop/form/shopFormSchema'

const BUCKET = 'shop-photos'

const AdminShopNewPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { addToast } = useUiStore()
  const { data: masterData } = useShopMasterData()

  const pendingFilesRef = useRef<File[]>([])

  const methods = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: DEFAULT_SHOP_FORM_VALUES,
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (values: ShopFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          name:           values.name,
          description:    values.description || null,
          prefecture_id:  values.prefectureId,
          city_id:        values.cityId ?? null,
          address:        values.address || null,
          price_range_id: values.priceRangeId ?? null,
          phone:          values.phone || null,
          website_url:    values.websiteUrl || null,
          instagram_url:  values.instagramUrl || null,
          twitter_url:    values.twitterUrl || null,
          tiktok_url:     values.tiktokUrl || null,
          status:         values.status,
          created_by:     user.id,
        } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (shopError) throw new Error(shopError.message)
      if (!shop) throw new Error('店舗の作成に失敗しました')

      const { error: catError } = await supabase
        .from('shop_categories')
        .insert(
          values.categoryIds.map((categoryId) => ({ shop_id: shop.id, category_id: categoryId })) as never,
        ) as unknown as { error: { message: string } | null }

      if (catError) throw new Error(catError.message)

      const files = pendingFilesRef.current
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${shop.id}/${crypto.randomUUID()}.${ext}`
        const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file)
        if (storageErr) throw new Error(storageErr.message)
        const { error: photoErr } = await supabase
          .from('shop_photos')
          .insert({ shop_id: shop.id, storage_path: path, order: i } as never) as unknown as {
            error: { message: string } | null
          }
        if (photoErr) {
          await supabase.storage.from(BUCKET).remove([path])
          throw new Error(photoErr.message)
        }
      }

      return shop.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      addToast({ title: '店舗を登録しました', variant: 'default', position: 'bottom-right' })
      navigate('/admin/shops')
    },
  })

  return (
    <ShopForm
      methods={methods}
      mode="new"
      showStatus
      showBusinessHours={false}
      showSidebar={false}
      masterData={masterData}
      photoSlot={
        <ShopPhotoNewSection
          num="05"
          onFilesChange={(files) => { pendingFilesRef.current = files }}
          animationDelay="100ms"
        />
      }
      onSubmit={(values) => mutate(values)}
      isPending={isPending}
      errorMessage={error ? (error as Error).message : undefined}
      cancelLink="/admin/shops"
      headerProps={{
        backgroundText: 'CREATE',
        context: 'admin',
        backLabel: '店舗管理',
        backLink: '/admin/shops',
        title: '店舗新規登録',
      }}
    />
  )
}

export default AdminShopNewPage
