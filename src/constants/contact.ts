export type ContactStatus = 'open' | 'in_progress' | 'closed'
export type ContactCategory = 'general' | 'shop_listing' | 'bug_report' | 'account' | 'other'

export interface Contact {
  id: string
  name: string
  email: string
  category: ContactCategory
  subject: string
  body: string
  status: ContactStatus
  is_noreply: boolean
  user_id: string | null
  created_at: string
}

export interface ContactReply {
  id: string
  contact_id: string
  body: string
  replied_by: string
  is_admin_reply: boolean
  created_at: string
  users: { display_name: string | null } | null
}

export const CATEGORY_LABEL: Record<ContactCategory, string> = {
  general:      '一般的なご質問',
  shop_listing: '店舗掲載について',
  bug_report:   'バグ・不具合',
  account:      'アカウントについて',
  other:        'その他',
}

export const STATUS_CONFIG: Record<ContactStatus, { label: string; borderClass: string; badgeClass: string }> = {
  open:        { label: '未対応', borderClass: 'border-l-amber-400', badgeClass: 'bg-amber-50 text-amber-700' },
  in_progress: { label: '対応中', borderClass: 'border-l-sky-400',   badgeClass: 'bg-sky-50 text-sky-700' },
  closed:      { label: '完了',   borderClass: 'border-l-border',    badgeClass: 'bg-muted text-muted-foreground' },
}
