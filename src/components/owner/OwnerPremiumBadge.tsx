import { Crown, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type OwnerPremiumBadgeVariant = 'solid' | 'soft' | 'outline' | 'gradient'
export type OwnerPremiumBadgeSize = 'xs' | 'sm' | 'md'
export type OwnerPremiumBadgeIcon = 'crown' | 'lock' | 'sparkle' | 'none'

interface OwnerPremiumBadgeProps {
  /** 表示ラベル（既定: オーナープレミアム） */
  label?: string
  /** 見た目（既定: solid＝ゴールド地に白文字） */
  variant?: OwnerPremiumBadgeVariant
  /** サイズ（既定: sm） */
  size?: OwnerPremiumBadgeSize
  /** 先頭アイコン（既定: crown） */
  icon?: OwnerPremiumBadgeIcon
  className?: string
}

const VARIANT_CLASS: Record<OwnerPremiumBadgeVariant, string> = {
  solid: 'bg-amber-400 text-white',
  soft: 'bg-amber-100 text-amber-700',
  outline: 'border border-amber-400 bg-transparent text-amber-600',
  gradient: 'bg-gradient-to-r from-amber-400 to-rose-400 text-white',
}

const SIZE_CLASS: Record<OwnerPremiumBadgeSize, { wrapper: string; icon: string }> = {
  xs: { wrapper: 'gap-1 px-1.5 py-0.5 text-[8px]', icon: 'h-2.5 w-2.5' },
  sm: { wrapper: 'gap-1 px-2 py-0.5 text-[10px]', icon: 'h-3 w-3' },
  md: { wrapper: 'gap-1.5 px-2.5 py-1 text-[11px]', icon: 'h-3.5 w-3.5' },
}

const ICON_MAP = {
  crown: Crown,
  lock: Lock,
  sparkle: Sparkles,
} as const

/**
 * オーナー向け有料プラン「オーナープレミアム」を示すバッジ。
 *
 * 一般ユーザー向けの「プレミアム会員」バッジ（UserPremiumBadge）とは
 * 用途・文言が異なるため、コンポーネントを分けている。
 * オーナーダッシュボード・ロック画面・店舗管理画面などで使用する。
 */
export const OwnerPremiumBadge = ({
  label = 'オーナープレミアム',
  variant = 'solid',
  size = 'sm',
  icon = 'crown',
  className,
}: OwnerPremiumBadgeProps) => {
  const sizeConf = SIZE_CLASS[size]
  const IconComponent = icon === 'none' ? null : ICON_MAP[icon]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm font-headline font-black uppercase tracking-[0.15em]',
        VARIANT_CLASS[variant],
        sizeConf.wrapper,
        className,
      )}
    >
      {IconComponent && <IconComponent className={sizeConf.icon} />}
      {label}
    </span>
  )
}
