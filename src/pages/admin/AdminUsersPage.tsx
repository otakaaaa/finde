import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Search, ChevronDown, Users, UserCheck, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

// ── Types ──────────────────────────────────────────────────────

interface UserRow {
  id: string
  role: UserRole
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// ── Config ─────────────────────────────────────────────────────

const ROLE_CONFIG: Record<UserRole, { label: string; borderClass: string; badgeClass: string; icon: React.ReactNode }> = {
  user:       { label: 'ユーザー',        borderClass: 'border-l-border',        badgeClass: 'bg-muted text-muted-foreground',         icon: <Users className="h-2.5 w-2.5" /> },
  shop_owner: { label: 'オーナー',        borderClass: 'border-l-sky-400',        badgeClass: 'bg-sky-50 text-sky-700',                icon: <UserCheck className="h-2.5 w-2.5" /> },
  admin:      { label: '管理者',          borderClass: 'border-l-violet-400',     badgeClass: 'bg-violet-50 text-violet-700',          icon: <Shield className="h-2.5 w-2.5" /> },
}

const ROLE_FILTERS = [
  { value: 'all',        label: 'すべて' },
  { value: 'user',       label: 'ユーザー' },
  { value: 'shop_owner', label: 'オーナー' },
  { value: 'admin',      label: '管理者' },
] as const

// ── Data hook ──────────────────────────────────────────────────

const useUsers = (role: string) =>
  useQuery({
    queryKey: ['admin-users', role],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('id, role, display_name, avatar_url, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(500)

      if (role !== 'all') query = query.eq('role', role)

      const { data, error } = await (query as unknown as Promise<{
        data: UserRow[] | null
        error: { message: string } | null
      }>)
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

// ── Sub-components ─────────────────────────────────────────────

interface UserCardProps {
  user: UserRow
  expanded: boolean
  onToggle: () => void
  onRoleChange: (id: string, role: UserRole) => void
  isUpdating: boolean
}

const UserCard = ({ user, expanded, onToggle, onRoleChange, isUpdating }: UserCardProps) => {
  const conf = ROLE_CONFIG[user.role]

  return (
    <div
      className={cn(
        'wish-card-enter border-l-[3px] bg-white editorial-shadow',
        conf.borderClass,
      )}
    >
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        {/* Avatar */}
        <div className="mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Users className="h-3.5 w-3.5 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-headline text-[13px] font-black tracking-tight text-foreground/80 truncate">
              {user.display_name ?? '名前未設定'}
            </p>
            <span className={cn(
              'flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider',
              conf.badgeClass,
            )}>
              {conf.icon}
              {conf.label}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="font-mono text-[10px] text-muted-foreground/40">{user.id.slice(0, 8)}…</span>
            <span className="text-[10px] text-muted-foreground/35">
              {new Date(user.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </span>
          </div>
        </div>

        <ChevronDown className={cn(
          'mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/25 transition-transform duration-200',
          expanded && 'rotate-180',
        )} />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* User detail */}
          <div className="mb-3 rounded-sm bg-muted/40 px-3 py-2.5">
            <dl className="space-y-1">
              <div className="flex items-baseline gap-2">
                <dt className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 w-16 shrink-0">ID</dt>
                <dd className="font-mono text-[10px] text-foreground/60 break-all">{user.id}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 w-16 shrink-0">登録日</dt>
                <dd className="text-[10px] text-foreground/60">
                  {new Date(user.created_at).toLocaleString('ja-JP', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 w-16 shrink-0">更新日</dt>
                <dd className="text-[10px] text-foreground/60">
                  {new Date(user.updated_at).toLocaleString('ja-JP', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Role change actions */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/25">
              ロール変更
            </span>
            {(['user', 'shop_owner', 'admin'] as UserRole[])
              .filter((r) => r !== user.role)
              .map((r) => {
                const c = ROLE_CONFIG[r]
                return (
                  <button
                    key={r}
                    onClick={() => onRoleChange(user.id, r)}
                    disabled={isUpdating}
                    className={cn(
                      'flex h-7 items-center gap-1 rounded-sm px-2.5 font-headline text-[9px] font-black uppercase tracking-wider transition-colors disabled:opacity-40',
                      c.badgeClass,
                    )}
                  >
                    {c.icon}
                    {c.label}に変更
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const AdminUsersPage = () => {
  const queryClient = useQueryClient()
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: users, isLoading, error } = useUsers(roleFilter)

  const { mutate: updateRole, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const { error } = await supabase
        .from('users')
        .update({ role } as never)
        .eq('id', id) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const filtered = (users ?? []).filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (u.display_name ?? '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    )
  })

  const counts = {
    all:        users?.length ?? 0,
    user:       users?.filter((u) => u.role === 'user').length ?? 0,
    shop_owner: users?.filter((u) => u.role === 'shop_owner').length ?? 0,
    admin:      users?.filter((u) => u.role === 'admin').length ?? 0,
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            USERS
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/admin"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボード
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Admin</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              ユーザー管理
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Control bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Role filters */}
            <div className="flex flex-wrap gap-1">
              {ROLE_FILTERS.map((f) => {
                const count = counts[f.value]
                return (
                  <button
                    key={f.value}
                    onClick={() => setRoleFilter(f.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-wider transition-all',
                      roleFilter === f.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={cn(
                        'rounded-sm px-1 tabular-nums text-[9px]',
                        roleFilter === f.value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground/60',
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="名前・IDで絞り込み"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-52 rounded-sm border border-border bg-white pl-7 pr-3 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {search && (
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">{filtered.length} 件</span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                No Users
              </span>
              <p className="text-xs text-muted-foreground/40">ユーザーはいません</p>
            </div>
          )}

          {/* List */}
          {!isLoading && filtered.length > 0 && (
            <div className="space-y-1.5">
              {filtered.map((user, i) => (
                <div key={user.id} style={{ animationDelay: `${i * 20}ms` }}>
                  <UserCard
                    user={user}
                    expanded={expandedId === user.id}
                    onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
                    onRoleChange={(id, role) => updateRole({ id, role })}
                    isUpdating={isUpdating}
                  />
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
