import { Heart, FileCheck2, Store, Mail, AlertTriangle, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NotificationType } from '@/types'

interface NotificationConfig {
  icon: LucideIcon
  iconClass: string
  bgClass: string
  label: string
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  wish_match: {
    icon: Heart,
    iconClass: 'text-pink-500',
    bgClass: 'bg-pink-50',
    label: 'ウィッシュマッチ',
  },
  owner_application_result: {
    icon: FileCheck2,
    iconClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    label: '申請結果',
  },
  admin_new_listing: {
    icon: Store,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
    label: '新規申請',
  },
  admin_new_contact: {
    icon: Mail,
    iconClass: 'text-sky-600',
    bgClass: 'bg-sky-50',
    label: 'お問い合わせ',
  },
  admin_review_report: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    label: '通報',
  },
  review_posted: {
    icon: Star,
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-50',
    label: 'レビュー',
  },
}
