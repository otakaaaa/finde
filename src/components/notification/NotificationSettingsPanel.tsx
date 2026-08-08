import { Bell, Mail } from 'lucide-react'
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  type NotificationSettings,
} from '@/hooks/useNotificationSettings'
import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label: string
}

const Toggle = ({ checked, onChange, disabled, label }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40',
      checked ? 'bg-primary' : 'bg-border',
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-[22px]' : 'translate-x-0.5',
      )}
    />
  </button>
)

/**
 * 通知の受信設定パネル。
 * 「フォロー中の店舗のお知らせ」をアプリ内・メールのチャネル別にON/OFFできる。
 */
export const NotificationSettingsPanel = () => {
  const { data: settings, isLoading } = useNotificationSettings()
  const { mutate: update, isPending } = useUpdateNotificationSettings()

  const current: NotificationSettings = settings ?? {
    followedShopInApp: true,
    followedShopEmail: true,
  }

  const disabled = isLoading || isPending

  return (
    <section className="rounded-xl border border-border">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold">通知設定</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          フォロー中の店舗からのお知らせの受け取り方法を選べます
        </p>
      </div>
      <div className="divide-y divide-border">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[13px] font-bold">アプリ内通知</p>
              <p className="text-[11px] text-muted-foreground">通知ベルとこの画面に表示します</p>
            </div>
          </div>
          <Toggle
            checked={current.followedShopInApp}
            disabled={disabled}
            label="フォロー中の店舗のお知らせ（アプリ内通知）"
            onChange={(checked) => update({ ...current, followedShopInApp: checked })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[13px] font-bold">メール通知</p>
              <p className="text-[11px] text-muted-foreground">登録メールアドレスに送信します</p>
            </div>
          </div>
          <Toggle
            checked={current.followedShopEmail}
            disabled={disabled}
            label="フォロー中の店舗のお知らせ（メール通知）"
            onChange={(checked) => update({ ...current, followedShopEmail: checked })}
          />
        </div>
      </div>
    </section>
  )
}
