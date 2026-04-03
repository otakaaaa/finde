import { useState } from 'react'
import { Link } from 'react-router'
import {
  Edit3, Tag, ExternalLink, Star, Heart, MapPin,
  Phone, Globe, Instagram, Twitter, Store, ChevronRight,
  ArrowUpRight, ChevronLeft,
} from 'lucide-react'
import { useOwnerShops } from '@/hooks/useOwnerShops'
import { cn } from '@/lib/utils'
import type { Shop } from '@/types'

// ── Config ─────────────────────────────────────────────────────

const SHOP_STATUS: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  public:  { label: '公開中', badgeClass: 'bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-400' },
  pending: { label: '審査中', badgeClass: 'bg-amber-50 text-amber-700',    dotClass: 'bg-amber-400 animate-pulse' },
  private: { label: '非公開', badgeClass: 'bg-muted text-muted-foreground', dotClass: 'bg-muted-foreground/40' },
}

// ── Sub-components ─────────────────────────────────────────────

const StatPanel = ({
  value,
  label,
  sub,
  index,
}: {
  value: string | number
  label: string
  sub?: string
  index: number
}) => (
  <div
    className="wish-card-enter border border-border bg-white p-4 editorial-shadow sm:p-5"
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <p className="mb-1 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
      {label}
    </p>
    <p className="font-headline text-2xl font-black leading-none tracking-tight text-foreground md:text-3xl">
      {value}
    </p>
    {sub && <p className="mt-1 text-[10px] text-muted-foreground/50">{sub}</p>}
  </div>
)

interface ActionCardProps {
  to: string
  icon: React.ReactNode
  index: string
  title: string
  desc: string
  external?: boolean
  animDelay?: number
}

const ActionCard = ({ to, icon, index, title, desc, external, animDelay = 0 }: ActionCardProps) => (
  <Link
    to={to}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    className="wish-card-enter group flex items-center gap-4 border border-border bg-white px-5 py-4 transition-all hover:border-primary/20 hover:bg-primary/[0.02] editorial-shadow"
    style={{ animationDelay: `${animDelay}ms` }}
  >
    <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/25">
      {index}
    </span>
    <div className={cn(
      'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground',
      'transition-colors group-hover:bg-primary group-hover:text-white',
    )}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-foreground/80">
        {title}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground/50">{desc}</p>
    </div>
    {external
      ? <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary/40" />
      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 transition-transform group-hover:translate-x-0.5 group-hover:text-primary/40" />
    }
  </Link>
)

const InfoRow = ({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
  href?: string
}) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 p-2.5">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/40">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/35">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-[11px] text-muted-foreground/70 transition-colors hover:text-primary"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-[11px] text-muted-foreground/70">{value}</p>
        )}
      </div>
    </div>
  )
}

// ── Shop Dashboard ─────────────────────────────────────────────

const ShopDashboard = ({ shop }: { shop: Shop }) => {
  const statusConf = SHOP_STATUS[shop.status] ?? SHOP_STATUS.private
  const ratingDisplay = shop.averageRating != null ? shop.averageRating.toFixed(1) : '—'

  return (
    <>
      {/* ── Shop header section */}
      <div className="relative overflow-hidden bg-primary px-6 pb-0 pt-8 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            OWN
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-8">
            {/* Status + name */}
            <div className="mb-1 flex items-center gap-2">
              <span className={cn(
                'flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider',
                statusConf.badgeClass,
              )}>
                <span className={cn('h-1.5 w-1.5 rounded-full', statusConf.dotClass)} />
                {statusConf.label}
              </span>
              {shop.area && (
                <span className="flex items-center gap-1 text-[10px] text-white/30">
                  <MapPin className="h-2.5 w-2.5" />
                  {shop.area.city}
                </span>
              )}
            </div>

            <h1 className="font-headline text-2xl font-black leading-tight tracking-tight text-white md:text-3xl">
              {shop.name}
            </h1>
            {shop.namePending && (
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-white/30">
                <span className="rounded-sm border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-black uppercase tracking-wider text-amber-300">
                  変更審査中
                </span>
                {shop.namePending}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 md:px-16">
          <div className="grid grid-cols-3 gap-3 pt-6 md:gap-4">
            <StatPanel
              value={ratingDisplay}
              label="Rating"
              sub="平均評価"
              index={0}
            />
            <StatPanel
              value={String(shop.reviewCount).padStart(2, '0')}
              label="Reviews"
              sub="レビュー件数"
              index={1}
            />
            <StatPanel
              value={String(shop.favoriteCount).padStart(2, '0')}
              label="Favorites"
              sub="お気に入り数"
              index={2}
            />
          </div>
        </div>
      </div>

      {/* ── Content */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px] lg:gap-12">

            {/* Main: actions */}
            <div>
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                  Actions
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-2">
                <ActionCard
                  to={`/owner/shops/${shop.id}`}
                  icon={<Edit3 className="h-4 w-4" />}
                  index="01"
                  title="店舗情報を編集"
                  desc="説明文・営業時間・連絡先などを更新する"
                  animDelay={0}
                />
                <ActionCard
                  to={`/owner/shops/${shop.id}/brands`}
                  icon={<Tag className="h-4 w-4" />}
                  index="02"
                  title="取り扱いブランドを管理"
                  desc="扱っているブランドを追加・削除する"
                  animDelay={55}
                />
                <ActionCard
                  to={`/shops/${shop.id}`}
                  icon={<ExternalLink className="h-4 w-4" />}
                  index="03"
                  title="公開ページを確認"
                  desc="ユーザーに表示されているページを見る"
                  external
                  animDelay={110}
                />
              </div>

              {/* Description preview */}
              {shop.description && (
                <div className="mt-10">
                  <div className="mb-4 flex items-baseline gap-3">
                    <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                      Description
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="wish-card-enter border-l-[3px] border-l-border bg-white px-5 py-4 editorial-shadow">
                    <p className="text-sm leading-relaxed text-muted-foreground/70 line-clamp-4">
                      {shop.description}
                    </p>
                    <Link
                      to={`/owner/shops/${shop.id}`}
                      className="mt-3 flex items-center gap-1 text-[10px] font-bold text-primary/60 transition-colors hover:text-primary"
                    >
                      編集する <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: shop info */}
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                  Info
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="wish-card-enter divide-y divide-border/60 border border-border bg-white editorial-shadow">
                <InfoRow
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="エリア"
                  value={shop.area ? `${shop.area.prefecture} ${shop.area.city}` : null}
                />
                <InfoRow
                  icon={<Store className="h-3.5 w-3.5" />}
                  label="価格帯"
                  value={shop.priceRange?.label}
                />
                <InfoRow
                  icon={<Phone className="h-3.5 w-3.5" />}
                  label="電話番号"
                  value={shop.phone}
                  href={shop.phone ? `tel:${shop.phone}` : undefined}
                />
                <InfoRow
                  icon={<Globe className="h-3.5 w-3.5" />}
                  label="公式サイト"
                  value={shop.websiteUrl}
                  href={shop.websiteUrl ?? undefined}
                />
                <InfoRow
                  icon={<Instagram className="h-3.5 w-3.5" />}
                  label="Instagram"
                  value={shop.instagramUrl}
                  href={shop.instagramUrl ?? undefined}
                />
                <InfoRow
                  icon={<Twitter className="h-3.5 w-3.5" />}
                  label="X"
                  value={shop.twitterUrl}
                  href={shop.twitterUrl ?? undefined}
                />
              </div>

              {/* Rating detail */}
              {shop.averageRating != null && (
                <div className="mt-6 wish-card-enter border border-border bg-white px-4 py-4 editorial-shadow">
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-headline text-lg font-black tracking-tight text-foreground">
                      {shop.averageRating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      / 5.0 ({shop.reviewCount} 件)
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${(shop.averageRating / 5) * 100}%` }}
                    />
                  </div>
                  <Link
                    to={`/shops/${shop.id}`}
                    className="mt-3 flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 transition-colors hover:text-foreground/60"
                  >
                    <Heart className="h-3 w-3" />
                    お気に入り {shop.favoriteCount} 件
                  </Link>
                </div>
              )}
            </aside>

          </div>
        </div>
      </div>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────

const OwnerDashboardPage = () => {
  const { data: shops, isLoading, isError } = useOwnerShops()
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)

  const selectedShop = shops?.find((s) => s.id === selectedShopId) ?? shops?.[0] ?? null
  const multiShop = (shops?.length ?? 0) > 1

  return (
    <div className="min-h-[calc(100dvh-56px)]">

      {/* ── Global page header */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/mypage"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" /> マイページ
            </Link>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — Owner
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              DASHBOARD
            </h1>
          </div>

          {/* Multi-shop selector */}
          {multiShop && (
            <div className="flex gap-0 overflow-x-auto">
              {shops!.map((shop) => {
                const isActive = (selectedShop?.id === shop.id)
                return (
                  <button
                    key={shop.id}
                    onClick={() => setSelectedShopId(shop.id)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 font-headline text-[10px] font-black uppercase tracking-[0.25em] transition-colors',
                      isActive
                        ? 'border-white text-white'
                        : 'border-transparent text-white/30 hover:text-white/60',
                    )}
                  >
                    {shop.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── States */}
      {isLoading && (
        <div className="flex justify-center bg-background py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="bg-background px-6 py-10 md:px-16">
          <div className="mx-auto max-w-5xl rounded-sm border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs font-medium text-red-700">店舗情報の読み込みに失敗しました</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && shops?.length === 0 && (
        <div className="bg-background">
          <div className="mx-auto max-w-5xl px-4 py-20 md:px-16">
            <div className="wish-card-enter flex flex-col items-center gap-4 border border-border bg-white py-16 text-center editorial-shadow">
              <Store className="h-10 w-10 text-muted-foreground/15" />
              <div>
                <p className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                  No Shops
                </p>
                <p className="mt-1 text-xs text-muted-foreground/50">
                  管理している店舗がありません
                </p>
              </div>
              <Link
                to="/owner-application/new"
                className="mt-2 bg-primary px-6 py-2.5 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90"
              >
                オーナー申請をする
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Shop dashboard */}
      {!isLoading && !isError && selectedShop && (
        <ShopDashboard shop={selectedShop} />
      )}

    </div>
  )
}

export default OwnerDashboardPage
