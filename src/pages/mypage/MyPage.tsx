import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Heart, List, Store, LogOut, ChevronRight, ArrowUpRight, Camera, Trash2, MessageCircle, Mail, Bell, Shield, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { validateAllowedImageFiles } from '@/lib/fileValidation'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { useFavoriteShops } from '@/hooks/useFavorites'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { OWNER_FEATURE_ENABLED, WISH_FEATURE_ENABLED } from '@/config/features'

const ROLE_LABEL: Record<string, string> = {
  user: 'MEMBER',
  shop_owner: 'OWNER',
  admin: 'ADMIN',
}

const AVATAR_BUCKET = 'user-avatars'

const getAvatarStoragePath = (avatarUrl: string | null) => {
  if (!avatarUrl) return null

  try {
    const url = new URL(avatarUrl)
    const marker = `/${AVATAR_BUCKET}/`
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) return null

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

const StatPanel = ({
  value,
  label,
  sublabel,
  index,
}: {
  value: string | number
  label: string
  sublabel?: string
  index: number
}) => (
  <div
    className="wish-card-enter border border-border bg-white p-3 sm:p-5 editorial-shadow"
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <p className="mb-1 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
      {label}
    </p>
    <p className="font-headline text-lg sm:text-3xl font-black leading-none tracking-tight text-foreground">
      {value}
    </p>
    {sublabel && (
      <p className="mt-1 text-[8px] sm:text-[10px] font-medium text-muted-foreground/50">{sublabel}</p>
    )}
  </div>
)

interface NavItemProps {
  to: string
  icon: React.ReactNode
  index: string
  label: string
  sublabel?: string
  external?: boolean
  animDelay?: number
}

const NavItem = ({ to, icon, index, label, sublabel, animDelay = 0 }: NavItemProps) => (
  <Link
    to={to}
    className="wish-card-enter group flex items-center gap-4 border border-border bg-white px-5 py-4 transition-all duration-150 hover:border-primary/20 hover:bg-primary/[0.02] editorial-shadow"
    style={{ animationDelay: `${animDelay}ms` }}
  >
    <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/25">
      {index}
    </span>
    <div className={cn(
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground',
      'group-hover:bg-primary group-hover:text-white transition-colors duration-150',
    )}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-foreground/80">
        {label}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-[10px] text-muted-foreground/50">{sublabel}</p>
      )}
    </div>
    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary/40" />
  </Link>
)

const MyPage = () => {
  const { user, refreshUser } = useAuth()
  const { openLogoutModal, openDeleteAccountModal } = useUiStore()
  const { data: favorites } = useFavoriteShops()

  const { data: ownerApplications } = useQuery({
    queryKey: ['my-owner-applications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('shop_listing_requests')
        .select('id, shop_name, status')
        .eq('submitted_by', user!.id)
        .eq('is_owner_request', true)
        .order('created_at', { ascending: false })
        .limit(5) as unknown as {
          data: { id: string; shop_name: string; status: string }[] | null
          error: unknown
        }
      return data ?? []
    },
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setUploadError(null)

    try {
      await validateAllowedImageFiles([file])
    } catch (err) {
      setUploadError('画像の検証に失敗しました')
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { data: currentUserRow } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .single() as unknown as { data: { avatar_url: string | null } | null; error: { message: string } | null }

    const path = `${user.id}/avatar`
    const previousAvatarPath = getAvatarStoragePath(currentUserRow?.avatar_url ?? user.avatarUrl)

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      setUploadError('アップロードに失敗しました')
      setUploading(false)
      return
    }

    const cacheBustedAvatarUrl = `${supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl}?t=${Date.now()}`

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: cacheBustedAvatarUrl,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', user.id)
      .select('id, avatar_url')
      .single() as unknown as { data: { id: string; avatar_url: string | null } | null; error: { message: string } | null }

    if (updateError || !updatedUser) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path])
      setUploadError('プロフィールの更新に失敗しました')
      setUploading(false)
      return
    }

    if (previousAvatarPath && previousAvatarPath !== path) {
      await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath])
    }

    await refreshUser()
    setUploading(false)

    // reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const initial = user?.displayName?.[0]?.toUpperCase() ?? '?'
  const roleLabel = ROLE_LABEL[user?.role ?? 'user'] ?? 'MEMBER'
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' })
    : '—'
  const favoriteCount = favorites?.length ?? 0

  return (
    <div>
      {/* ── Hero / Profile header ─────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-10 pt-10 md:px-16">
        {/* Giant monogram watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end select-none overflow-hidden pr-4 md:pr-10">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(120px, 22vw, 240px)' }}
          >
            {initial}
          </span>
        </div>

        <div className="relative mx-auto max-w-3xl">
          {/* Role badge */}
          <div className="mb-8 inline-flex items-center gap-1.5 border border-white/10 px-3 py-1">
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.5em] text-white/40">
              {roleLabel}
            </span>
          </div>

          {/* Avatar + name */}
          <div className="flex items-end gap-5">
            {/* Avatar — clickable upload */}
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="group relative block h-16 w-16 overflow-hidden rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                title="プロフィール画像を変更"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName ?? ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center border border-white/10 bg-white/[0.06]">
                    <span className="font-headline text-2xl font-black text-white/60">{initial}</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/50 transition-opacity duration-200',
                  uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}>
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <Camera className="h-4 w-4 text-white" />
                      <span className="font-headline text-[7px] font-black uppercase tracking-widest text-white/80">
                        変更
                      </span>
                    </>
                  )}
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="pb-0.5">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
                — Profile
              </p>
              <h1 className="font-headline text-2xl font-black leading-none tracking-tight text-white md:text-3xl">
                {user?.displayName ?? '名前未設定'}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* ── Upload error ─────────────────────────── */}
      {uploadError && (
        <div className="bg-primary px-6 pb-4 md:px-16">
          <div className="mx-auto max-w-3xl">
            <p className="text-[11px] font-medium text-red-300">{uploadError}</p>
          </div>
        </div>
      )}

      {/* ── Stats ────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 md:px-16">
          {/* Stats row overlapping the section break slightly */}
          <div className="-mt-0 grid grid-cols-2 gap-3 pt-8 md:gap-4">
            <StatPanel
              value={String(favoriteCount).padStart(2, '0')}
              label="Favorites"
              sublabel="お気に入り店舗"
              index={0}
            />
            <StatPanel
              value={memberSince}
              label="Member Since"
              index={1}
            />
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-16 md:py-12">

          {/* Section label */}
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              Menu
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <NavItem
              to="/mypage/favorites"
              icon={<Heart className="h-3.5 w-3.5" />}
              index="01"
              label="お気に入り"
              sublabel="保存した店舗を確認する"
              animDelay={0}
            />
            {WISH_FEATURE_ENABLED && (
              <NavItem
                to="/wishes"
                icon={<List className="h-3.5 w-3.5" />}
                index="02"
                label="ウィッシュリスト"
                sublabel="探しているアイテムを管理する"
                animDelay={55}
              />
            )}
            <NavItem
              to="/listing-request"
              icon={<Store className="h-3.5 w-3.5" />}
              index="02"
              label="店舗の掲載申請"
              sublabel="知っている店舗を登録する"
              animDelay={55}
            />
            {OWNER_FEATURE_ENABLED && (
              <NavItem
                to="/owner-application/new"
                icon={<MessageCircle className="h-3.5 w-3.5" />}
                index="03"
                label="オーナー申請"
                sublabel="自分の店舗としてオーナー権限を申請する"
                animDelay={110}
              />
            )}
            <NavItem
              to="/mypage/contacts"
              icon={<Mail className="h-3.5 w-3.5" />}
              index="03"
              label="お問い合わせ履歴"
              sublabel="過去のお問い合わせを確認する"
              animDelay={110}
            />
            <NavItem
              to="/mypage/notifications"
              icon={<Bell className="h-3.5 w-3.5" />}
              index="04"
              label="通知"
              sublabel="お知らせや申請結果を確認する"
              animDelay={165}
            />
            <NavItem
              to="/mypage/security"
              icon={<Shield className="h-3.5 w-3.5" />}
              index="05"
              label="セキュリティ設定"
              sublabel="二段階認証の設定"
              animDelay={220}
            />
            <NavItem
              to="/mypage/subscription"
              icon={<Crown className="h-3.5 w-3.5" />}
              index="06"
              label="プレミアム会員"
              sublabel="サブスクリプションの確認・管理"
              animDelay={275}
            />
          </div>

          {/* Owner application DM links — show for non-owners with pending/approved applications */}
          {ownerApplications && ownerApplications.length > 0 && user?.role === 'user' && (
            <div className="mt-8">
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                  オーナー申請
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {ownerApplications.map((app, i) => {
                  const isPending = app.status === 'pending'
                  return (
                    <Link
                      key={app.id}
                      to={`/owner-application/${app.id}`}
                      className={cn(
                        'wish-card-enter flex items-center gap-4 border px-5 py-4 transition-all editorial-shadow',
                        isPending
                          ? 'border-amber-200 bg-amber-50/60 hover:border-amber-300'
                          : 'border-border bg-white hover:border-primary/20',
                      )}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm',
                        isPending ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground',
                      )}>
                        <MessageCircle className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-foreground/80 truncate">
                          {app.shop_name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                          {isPending ? '審査中 — フクナビ運営とのDM' : app.status === 'approved' ? '承認済' : '却下'}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Owner/Admin links */}
          {(user?.role === 'shop_owner' || user?.role === 'admin') && (
            <div className="mt-8">
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                  {user.role === 'admin' ? 'Admin' : 'Owner'}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2">
                {user.role === 'shop_owner' && (
                  <Link
                    to="/owner"
                    className="wish-card-enter group flex items-center gap-4 border border-primary/20 bg-primary/[0.03] px-5 py-4 transition-all hover:border-primary/40"
                    style={{ animationDelay: '220ms' }}
                  >
                    <span className="font-headline text-[9px] font-black tabular-nums text-primary/25">01</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary text-white">
                      <Store className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-primary/70">
                        オーナーダッシュボード
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-primary/30" />
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="wish-card-enter group flex items-center gap-4 border border-primary/20 bg-primary/[0.03] px-5 py-4 transition-all hover:border-primary/40"
                    style={{ animationDelay: '220ms' }}
                  >
                    <span className="font-headline text-[9px] font-black tabular-nums text-primary/25">01</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary text-white">
                      <Store className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-primary/70">
                        管理画面
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-primary/30" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Sign out + Danger zone */}
          <div className="mt-10 border-t border-border pt-8">
            <div className="flex items-center justify-between">
              <button
                onClick={openLogoutModal}
                className={cn(
                  'group flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em]',
                  'text-muted-foreground/40 transition-colors hover:text-foreground/70',
                )}
              >
                <LogOut className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
                Sign Out
              </button>

              <button
                onClick={openDeleteAccountModal}
                className={cn(
                  'group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]',
                  'text-muted-foreground/25 transition-colors hover:text-red-500',
                )}
              >
                <Trash2 className="h-3 w-3" />
                アカウントを削除
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default MyPage
