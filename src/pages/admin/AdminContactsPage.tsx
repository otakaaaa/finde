import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Contact, ContactStatus } from '@/constants/contact'
import { cn } from '@/lib/utils'
import { ContactCard } from '@/components/contact/ContactCard'
import { useDebounce } from '@/hooks/useDebounce'
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination'
import type { PageSizeOption } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'

// ── Config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',         label: 'すべて' },
  { value: 'open',        label: '未対応' },
  { value: 'in_progress', label: '対応中' },
  { value: 'closed',      label: '完了' },
] as const

// ── Data hooks ─────────────────────────────────────────────────

type ContactCounts = { all: number; open: number; in_progress: number; closed: number }

const useContactCounts = () =>
  useQuery({
    queryKey: ['admin-contact-counts'],
    staleTime: 60_000,
    queryFn: async (): Promise<ContactCounts> => {
      const [all, open, inProgress, closed] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>,
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'open') as unknown as Promise<{ count: number | null }>,
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'in_progress') as unknown as Promise<{ count: number | null }>,
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('status', 'closed') as unknown as Promise<{ count: number | null }>,
      ])
      return { all: all.count ?? 0, open: open.count ?? 0, in_progress: inProgress.count ?? 0, closed: closed.count ?? 0 }
    },
  })

const useContacts = (status: string, search: string, page: number, pageSize: number) =>
  useQuery({
    queryKey: ['admin-contacts', status, search, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (status !== 'all') query = query.eq('status', status)
      if (search) query = query.or(`subject.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,body.ilike.%${search}%`)

      const { data, count, error } = await (query as unknown as Promise<{
        data: Contact[] | null
        count: number | null
        error: { message: string } | null
      }>)
      if (error) throw new Error(error.message)
      return { items: data ?? [], totalCount: count ?? 0 }
    },
  })

// ── Page ───────────────────────────────────────────────────────

const AdminContactsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])

  const debouncedSearch = useDebounce(search)

  useEffect(() => { setPage(1) }, [statusFilter, debouncedSearch, pageSize])

  const { data, isLoading, error } = useContacts(statusFilter, debouncedSearch, page, pageSize)
  const { data: counts } = useContactCounts()

  const contacts = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handlePageSizeChange = (size: PageSizeOption) => { setPageSize(size); setPage(1) }

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ status } as never)
        .eq('id', id) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-contact-counts'] })
    },
  })

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
                const count = counts?.[f.value] ?? 0
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

            {debouncedSearch && !isLoading && (
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">{totalCount} 件</span>
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
          {!isLoading && !error && contacts.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                No Contacts
              </span>
              <p className="text-xs text-muted-foreground/40">お問い合わせはありません</p>
            </div>
          )}

          {/* List */}
          {!isLoading && contacts.length > 0 && (
            <div className="space-y-1.5">
              {contacts.map((contact, i) => (
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
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminContactsPage
