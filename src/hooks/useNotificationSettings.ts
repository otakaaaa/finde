import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface NotificationSettings {
  /** フォロー中の店舗のお知らせ: アプリ内通知 */
  followedShopInApp: boolean
  /** フォロー中の店舗のお知らせ: メール通知 */
  followedShopEmail: boolean
}

/** 行が無いユーザーの既定値（両チャネルON） */
const DEFAULT_SETTINGS: NotificationSettings = {
  followedShopInApp: true,
  followedShopEmail: true,
}

interface SettingsRow {
  followed_shop_in_app: boolean
  followed_shop_email: boolean
}

/** 通知の受信設定を取得する（未設定なら既定値） */
export const useNotificationSettings = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async (): Promise<NotificationSettings> => {
      if (!user) return DEFAULT_SETTINGS
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('followed_shop_in_app, followed_shop_email')
        .eq('user_id', user.id)
        .maybeSingle() as { data: SettingsRow | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      if (!data) return DEFAULT_SETTINGS
      return {
        followedShopInApp: data.followed_shop_in_app,
        followedShopEmail: data.followed_shop_email,
      }
    },
    enabled: !!user,
  })
}

/** 通知の受信設定を保存する（upsert・楽観的更新つき） */
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (settings: NotificationSettings) => {
      if (!user) throw new Error('ログインが必要です')
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          followed_shop_in_app: settings.followedShopInApp,
          followed_shop_email: settings.followedShopEmail,
          updated_at: new Date().toISOString(),
        } as never)
      if (error) throw new Error(error.message)
    },
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: ['notification-settings', user?.id] })
      const previous = queryClient.getQueryData<NotificationSettings>(['notification-settings', user?.id])
      queryClient.setQueryData(['notification-settings', user?.id], settings)
      return { previous }
    },
    onError: (_err, _settings, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notification-settings', user?.id], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] })
    },
  })
}
