import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { ChevronLeft, Search, GitMerge, RotateCcw, Tag, User, Plus, Upload, X, AlertCircle, Check, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination'
import type { PageSizeOption } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { useAuth } from '@/hooks/useAuth'

// ── Types ──────────────────────────────────────────────────────

type BrandStatus = 'active' | 'merged'

interface BrandRow {
  id: string
  name: string
  name_kana: string | null
  aliases: string[]
  status: BrandStatus
  submitted_by: string | null
  created_at: string
  users: { display_name: string | null } | null
}

interface CsvBrandRow {
  name: string
  name_kana: string
  aliases: string[]
  error?: string
}

// ── Data hooks ─────────────────────────────────────────────────

type BrandCounts = { all: number; active: number; merged: number }

const useAdminBrandCounts = () =>
  useQuery({
    queryKey: ['admin-brand-counts'],
    staleTime: 60_000,
    queryFn: async (): Promise<BrandCounts> => {
      const [all, active, merged] = await Promise.all([
        supabase.from('brands').select('id', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>,
        supabase.from('brands').select('id', { count: 'exact', head: true }).eq('status', 'active') as unknown as Promise<{ count: number | null }>,
        supabase.from('brands').select('id', { count: 'exact', head: true }).eq('status', 'merged') as unknown as Promise<{ count: number | null }>,
      ])
      return { all: all.count ?? 0, active: active.count ?? 0, merged: merged.count ?? 0 }
    },
  })

const useAdminBrands = (status: string, search: string, page: number, pageSize: number) =>
  useQuery({
    queryKey: ['admin-brands', status, search, page, pageSize],
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      // count: 'exact' is expensive (full COUNT(*) scan) — only use it when
      // search is active, since filtered totals can't come from the cached counts.
      const withCount = search.length > 0
      let query = supabase
        .from('brands')
        .select(
          'id, name, name_kana, aliases, status, submitted_by, created_at, users ( display_name )',
          withCount ? { count: 'exact' } : undefined,
        )
        .order('created_at', { ascending: false })
        .range(from, to)

      if (status !== 'all') query = query.eq('status', status)
      if (search) query = query.or(`name.ilike.%${search}%,name_kana.ilike.%${search}%`)

      const { data, count, error } = await (query as unknown as Promise<{ data: BrandRow[] | null; count: number | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return { items: data ?? [], searchCount: count }
    },
  })

// ── CSV parser ─────────────────────────────────────────────────

const parseCsvText = (text: string): CsvBrandRow[] => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  // Skip header row if first cell looks like a header (non-numeric, contains 'name' etc.)
  const firstLine = lines[0]?.toLowerCase() ?? ''
  const hasHeader = firstLine.startsWith('name') || firstLine.startsWith('ブランド')
  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines.map((line): CsvBrandRow => {
    // CSV split respecting double-quoted fields
    const cols = line.match(/("(?:[^"]|"")*"|[^,]*)/g)?.map((c) =>
      c.startsWith('"') ? c.slice(1, -1).replace(/""/g, '"') : c
    ) ?? []

    const name = cols[0]?.trim() ?? ''
    const name_kana = cols[1]?.trim() ?? ''
    const aliasRaw = cols[2]?.trim() ?? ''
    const aliases = aliasRaw ? aliasRaw.split(/[、,]/).map((a) => a.trim()).filter(Boolean) : []

    return {
      name,
      name_kana,
      aliases,
      error: name ? undefined : 'ブランド名が空です',
    }
  }).filter((r) => r.name || r.error)
}

// ── Config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',    label: 'すべて' },
  { value: 'active', label: '有効' },
  { value: 'merged', label: 'マージ済' },
] as const

const STATUS_CONFIG: Record<BrandStatus, { label: string; borderClass: string; badgeClass: string }> = {
  active: { label: '有効',     borderClass: 'border-l-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700' },
  merged: { label: 'マージ済', borderClass: 'border-l-border',      badgeClass: 'bg-muted text-muted-foreground' },
}

// ── AddBrandModal ──────────────────────────────────────────────

interface AddBrandModalProps {
  onClose: () => void
  onSuccess: () => void
}

const AddBrandModal = ({ onClose, onSuccess }: AddBrandModalProps) => {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [nameKana, setNameKana] = useState('')
  const [aliasInput, setAliasInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('ブランド名を入力してください')
      const aliases = aliasInput.split(/[、,]/).map((a) => a.trim()).filter(Boolean)
      const { error: insertError } = await supabase
        .from('brands')
        .insert({
          name: name.trim(),
          name_kana: nameKana.trim() || null,
          aliases,
          submitted_by: user?.id ?? null,
        } as never) as unknown as { error: { message: string } | null }
      if (insertError) throw new Error(insertError.message)
    },
    onSuccess: () => { onSuccess(); onClose() },
    onError: (e) => setError((e as Error).message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white editorial-shadow">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/70">
            ブランドを追加
          </span>
          <button onClick={onClose} className="text-muted-foreground/40 transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
              ブランド名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: Needles"
              autoFocus
              className="h-9 w-full border border-border bg-white px-3 text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
              ブランド名（カナ）
            </label>
            <input
              type="text"
              value={nameKana}
              onChange={(e) => setNameKana(e.target.value)}
              placeholder="例: ニードルス"
              className="h-9 w-full border border-border bg-white px-3 text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50">
              別名・表記ゆれ
            </label>
            <input
              type="text"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              placeholder="カンマ区切りで複数入力 例: NEEDLES, ニードルス"
              className="h-9 w-full border border-border bg-white px-3 text-sm placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 bg-primary font-headline text-[10px] font-black uppercase tracking-[0.25em] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <><Plus className="h-3 w-3" />追加する</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 border border-border px-4 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground/20"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── CsvImportModal ─────────────────────────────────────────────

interface CsvImportModalProps {
  onClose: () => void
  onSuccess: (count: number) => void
}

const CsvImportModal = ({ onClose, onSuccess }: CsvImportModalProps) => {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<CsvBrandRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  const validRows = rows.filter((r) => !r.error)
  const errorRows = rows.filter((r) => r.error)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCsvText(text))
      setImportError(null)
      setDone(false)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    setImportError(null)
    try {
      // Chunk to avoid hitting request size limits
      const CHUNK = 100
      let inserted = 0
      for (let i = 0; i < validRows.length; i += CHUNK) {
        const chunk = validRows.slice(i, i + CHUNK).map((r) => ({
          name: r.name,
          name_kana: r.name_kana || null,
          aliases: r.aliases,
          submitted_by: user?.id ?? null,
        }))
        const { error } = await supabase
          .from('brands')
          .insert(chunk as never) as unknown as { error: { message: string } | null }
        if (error) throw new Error(error.message)
        inserted += chunk.length
      }
      setImportedCount(inserted)
      setDone(true)
      onSuccess(inserted)
    } catch (e) {
      setImportError((e as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white editorial-shadow">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/70">
            CSV 一括インポート
          </span>
          <button onClick={onClose} className="text-muted-foreground/40 transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-6 space-y-5">
          {/* Format guide */}
          {rows.length === 0 && (
            <div className="rounded-sm border border-border bg-muted/30 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">CSVフォーマット</p>
                <button
                  onClick={() => {
                    const sample = [
                      'name,name_kana,aliases',
                      'Needles,ニードルス,"NEEDLES,ネドルス"',
                      'UNUSED,アンユーズド,',
                      'Engineered Garments,エンジニアドガーメンツ,',
                      'COMOLI,コモリ,',
                      'Graphpaper,グラフペーパー,',
                    ].join('\n')
                    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'brands_sample.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary/70 transition-colors hover:text-primary"
                >
                  <Download className="h-3 w-3" />
                  サンプルをダウンロード
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground/60">
                1列目: ブランド名（必須）、2列目: カナ（任意）、3列目: 別名（カンマ区切り・任意）
              </p>
              <code className="mt-2 block rounded-sm bg-muted px-3 py-2 font-mono text-[10px] text-muted-foreground">
                Needles,ニードルス,"NEEDLES,ネドルス"<br />
                UNUSED,アンユーズド,<br />
                Engineered Garments,エンジニアドガーメンツ,
              </code>
              <p className="mt-1.5 text-[10px] text-muted-foreground/40">
                ※ 1行目がヘッダー行（name/ブランド名など）の場合は自動スキップします
              </p>
            </div>
          )}

          {/* File input */}
          {!done && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-10 w-full items-center justify-center gap-2 border border-dashed border-border bg-muted/20 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 transition-colors hover:border-primary/40 hover:text-primary/70"
              >
                <Upload className="h-3.5 w-3.5" />
                {rows.length > 0 ? 'CSVを選択し直す' : 'CSVファイルを選択'}
              </button>
            </div>
          )}

          {/* Error */}
          {importError && (
            <div className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-700">{importError}</p>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-headline text-lg font-black tracking-tight text-foreground">
                  {importedCount} 件インポート完了
                </p>
                <p className="mt-1 text-xs text-muted-foreground/50">ブランド一覧に反映されました</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 h-9 border border-border px-6 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                閉じる
              </button>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && !done && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-3">
                <span className="font-headline text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
                  プレビュー
                </span>
                <span className="rounded-sm bg-emerald-50 px-2 py-0.5 font-headline text-[9px] font-black text-emerald-700">
                  有効 {validRows.length} 件
                </span>
                {errorRows.length > 0 && (
                  <span className="rounded-sm bg-red-50 px-2 py-0.5 font-headline text-[9px] font-black text-red-600">
                    エラー {errorRows.length} 件（スキップ）
                  </span>
                )}
              </div>

              {/* Table */}
              <div className="max-h-64 overflow-y-auto border border-border">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-muted/60">
                    <tr>
                      <th className="px-3 py-2 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">ブランド名</th>
                      <th className="px-3 py-2 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">カナ</th>
                      <th className="px-3 py-2 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">別名</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {rows.map((row, i) => (
                      <tr key={i} className={row.error ? 'bg-red-50/50' : ''}>
                        <td className="px-3 py-2">
                          {row.error ? (
                            <span className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              {row.error}
                            </span>
                          ) : (
                            <span className="font-medium text-foreground/80">{row.name}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground/50">{row.name_kana}</td>
                        <td className="px-3 py-2 text-muted-foreground/50">{row.aliases.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 bg-primary font-headline text-[10px] font-black uppercase tracking-[0.25em] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {importing ? (
                    <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />インポート中...</>
                  ) : (
                    <><Upload className="h-3 w-3" />{validRows.length} 件をインポート</>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={importing}
                  className="h-9 border border-border px-4 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground/20 disabled:opacity-40"
                >
                  キャンセル
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── BrandCard ──────────────────────────────────────────────────

interface BrandCardProps {
  brand: BrandRow
  displayIndex: number
  animationIndex: number
  onMerge: (id: string) => void
  onRestore: (id: string) => void
  isUpdating: boolean
}

const BrandCard = ({ brand, displayIndex, animationIndex, onMerge, onRestore, isUpdating }: BrandCardProps) => {
  const conf = STATUS_CONFIG[brand.status]

  return (
    <div
      className={cn(
        'wish-card-enter group relative border-l-[3px] bg-white editorial-shadow',
        conf.borderClass,
      )}
      style={{ animationDelay: `${animationIndex * 25}ms` }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="w-7 shrink-0 font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">
          {String(displayIndex + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-headline text-[13px] font-black tracking-tight text-foreground/80">
              {brand.name}
            </p>
            {brand.name_kana && (
              <span className="text-[10px] text-muted-foreground/40">{brand.name_kana}</span>
            )}
            <span className={cn('sm:hidden rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
              {conf.label}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {brand.aliases.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <Tag className="h-2.5 w-2.5 shrink-0" />
                {brand.aliases.join(' · ')}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
              <User className="h-2.5 w-2.5 shrink-0" />
              {brand.users?.display_name ?? '管理者'}
            </span>
            <span className="tabular-nums text-[10px] text-muted-foreground/30">
              {new Date(brand.created_at).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' })}
            </span>
          </div>
        </div>

        <span className={cn('hidden sm:inline-flex shrink-0 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
          {conf.label}
        </span>

        <div className="flex sm:hidden shrink-0 items-center gap-1.5">
          {brand.status === 'active' && (
            <button
              onClick={() => onMerge(brand.id)}
              disabled={isUpdating}
              title="マージ済にする"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-muted-foreground transition-colors hover:bg-foreground hover:text-white disabled:opacity-40"
            >
              <GitMerge className="h-3.5 w-3.5" />
            </button>
          )}
          {brand.status === 'merged' && (
            <button
              onClick={() => onRestore(brand.id)}
              disabled={isUpdating}
              title="有効に戻す"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {brand.status === 'active' && (
          <button
            onClick={() => onMerge(brand.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-muted px-2 font-headline text-[9px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:bg-foreground hover:text-white disabled:opacity-40"
          >
            <GitMerge className="h-3 w-3" />
            マージ済
          </button>
        )}
        {brand.status === 'merged' && (
          <button
            onClick={() => onRestore(brand.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-emerald-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" />
            有効に戻す
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const AdminBrandsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)

  const debouncedSearch = useDebounce(search)

  useEffect(() => { setPage(1) }, [statusFilter, debouncedSearch, pageSize])

  const { data, isLoading, error } = useAdminBrands(statusFilter, debouncedSearch, page, pageSize)
  const { data: counts } = useAdminBrandCounts()

  const brands = data?.items ?? []
  // When searching, use the count returned from the search query.
  // Otherwise, use the pre-cached tab counts to avoid an extra COUNT(*) per page turn.
  const cachedCount = counts?.[statusFilter as keyof BrandCounts] ?? counts?.all ?? 0
  const totalCount = debouncedSearch ? (data?.searchCount ?? 0) : cachedCount
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handlePageSizeChange = (size: PageSizeOption) => { setPageSize(size); setPage(1) }

  const invalidateBrands = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
    queryClient.invalidateQueries({ queryKey: ['admin-brand-counts'] })
    queryClient.invalidateQueries({ queryKey: ['brands-search'] })
    queryClient.invalidateQueries({ queryKey: ['shop-brands'] })
  }

  const { mutate: updateBrandStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ brandId, status }: { brandId: string; status: BrandStatus }) => {
      const { error } = await supabase
        .from('brands')
        .update({ status } as never)
        .eq('id', brandId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: invalidateBrands,
  })

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            BRANDS
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/admin"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 transition-colors hover:text-foreground/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボード
            </Link>
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">
                  — Admin
                </p>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
                  ブランド管理
                </h1>
              </div>

              {/* Action buttons */}
              <div className="mb-0.5 flex items-center gap-2">
                <button
                  onClick={() => setShowCsvModal(true)}
                  className="flex h-8 items-center gap-1.5 border border-border bg-foreground/10 px-3 text-[10px] font-bold text-foreground/80 transition-colors hover:bg-foreground/20 hover:text-foreground"
                >
                  <Upload className="h-3 w-3" />
                  CSV
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex h-8 items-center gap-1.5 border border-border bg-foreground/10 px-3 text-[10px] font-bold text-foreground/80 transition-colors hover:bg-foreground/20 hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  追加
                </button>
              </div>
            </div>
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
                placeholder="ブランド名・カナで絞り込み"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 rounded-sm border border-border bg-white pl-7 pr-3 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {debouncedSearch && !isLoading && (
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                {totalCount} 件
              </span>
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
          {!isLoading && !error && brands.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                No Brands
              </span>
              <p className="text-xs text-muted-foreground/50">
                {debouncedSearch ? '該当するブランドがありません' : 'まだブランドが登録されていません'}
              </p>
              {!debouncedSearch && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] text-primary underline-offset-2 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  最初のブランドを追加する
                </button>
              )}
            </div>
          )}

          {/* List */}
          {!isLoading && brands.length > 0 && (
            <div className="space-y-1.5">
              {brands.map((brand, i) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  displayIndex={(page - 1) * pageSize + i}
                  animationIndex={i}
                  onMerge={(id) => updateBrandStatus({ brandId: id, status: 'merged' })}
                  onRestore={(id) => updateBrandStatus({ brandId: id, status: 'active' })}
                  isUpdating={isUpdating}
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

      {/* Modals */}
      {showAddModal && (
        <AddBrandModal
          onClose={() => setShowAddModal(false)}
          onSuccess={invalidateBrands}
        />
      )}
      {showCsvModal && (
        <CsvImportModal
          onClose={() => setShowCsvModal(false)}
          onSuccess={invalidateBrands}
        />
      )}
    </div>
  )
}

export default AdminBrandsPage
