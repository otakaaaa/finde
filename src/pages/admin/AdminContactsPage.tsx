import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Contact, ContactStatus } from '@/constants/contact'
import { cn } from '@/lib/utils'
import { ContactCard } from '@/components/contact/ContactCard'
import { usePagination } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'

// ── Config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',         label: 'すべて' },
  { value: 'open',        label: '未対応' },
  { value: 'in_progress', label: '対応中' },
  { value: 'closed',      label: '完了' },
] as const

// ── Data hook ──────────────────────────────────────────────────

const useContacts = (status: string) =>
  useQuery({
    queryKey: ['admin-contacts', status],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (status !== 'all') query = query.eq('status', status)

      const { data, error } = await (query as unknown as Promise<{
        data: Contact[] | null
        error: { message: string } | null
      }>)
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

// ── Page ───────────────────────────────────────────────────────

const AdminContactsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: contacts, isLoading, error } = useContacts(statusFilter)

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ status } as never)
        .eq('id', id) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-contacts'] }),
  })

  const filtered = (contacts ?? []).filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.subject.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q)
    )
  })

  const { page, pageSize, totalPages, totalItems, paginatedItems, setPage, setPageSize, resetPage } =
    usePagination(filtered)

  useEffect(() => { resetPage() }, [statusFilter, search])

  const counts = {
    all:         contacts?.length ?? 0,
    open:        contacts?.filter((c) => c.status === 'open').length ?? 0,
    in_progress: contacts?.filter((c) => c.status === 'in_progress').length ?? 0,
    closed:      contacts?.filter((c) => c.status === 'closed').length ?? 0,
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
            INBOX
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
              お問い合わせ
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Control bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => {
                const count = counts[f.value]
                return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-wider transition-all',
                      statusFilter === f.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={cn(
                        'rounded-sm px-1 tabular-nums text-[9px]',
                        statusFilter === f.value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground/60',
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="件名・名前・メールで絞り込み"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 rounded-sm border border-border bg-white pl-7 pr-3 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
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
                No Contacts
              </span>
              <p className="text-xs text-muted-foreground/40">お問い合わせはありません</p>
            </div>
          )}

          {/* List */}
          {!isLoading && filtered.length > 0 && (
            <div className="space-y-1.5">
              {paginatedItems.map((contact, i) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  expanded={expandedId === contact.id}
                  onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                  isAdmin={true}
                  onStatusChange={(id, status) => updateStatus({ id, status })}
                  isUpdating={isUpdating}
                  index={(page - 1) * pageSize + i}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminContactsPage
