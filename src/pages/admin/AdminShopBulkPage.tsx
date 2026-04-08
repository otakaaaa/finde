import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Upload, Download, CheckCircle2, XCircle,
  FileText, AlertTriangle, ArrowRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Area, Category, PriceRange } from '@/types'

// -----------------------------------------------------------------------
// CSV パーサー（ダブルクォート対応）
// -----------------------------------------------------------------------
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const cells: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    cells.push(current)
    rows.push(cells)
  }

  return rows
}

// -----------------------------------------------------------------------
// 型定義
// -----------------------------------------------------------------------
const COLUMNS = [
  'name',
  'area_city',
  'categories',
  'description',
  'phone',
  'website_url',
  'instagram_url',
  'twitter_url',
  'status',
  'price_range_label',
] as const

type ColKey = (typeof COLUMNS)[number]

interface ParsedRow {
  rowIndex: number
  raw: Record<ColKey, string>
  name: string
  area: Area | null
  categories: Category[]
  description: string
  phone: string
  websiteUrl: string
  instagramUrl: string
  twitterUrl: string
  status: 'public' | 'private' | 'pending'
  priceRange: PriceRange | null
  errors: string[]
}

interface ImportResult {
  success: number
  failures: { rowIndex: number; message: string }[]
}

// -----------------------------------------------------------------------
// マスターデータ取得
// -----------------------------------------------------------------------
const useMasterData = () =>
  useQuery({
    queryKey: ['master-data'],
    queryFn: async () => {
      const [areas, categories, priceRanges] = await Promise.all([
        supabase.from('areas').select('id, prefecture, city, slug').order('id') as unknown as Promise<{ data: Area[] | null; error: unknown }>,
        supabase.from('categories').select('id, code, name').order('id') as unknown as Promise<{ data: Category[] | null; error: unknown }>,
        supabase.from('price_ranges').select('id, label, min_price, max_price').order('id') as unknown as Promise<{ data: ({ id: number; label: string; min_price: number | null; max_price: number | null })[] | null; error: unknown }>,
      ])
      return {
        areas: areas.data ?? [],
        categories: categories.data ?? [],
        priceRanges: (priceRanges.data ?? []).map((p) => ({
          id: p.id,
          label: p.label,
          minPrice: p.min_price,
          maxPrice: p.max_price,
        })) as PriceRange[],
      }
    },
    staleTime: Infinity,
  })

// -----------------------------------------------------------------------
// サンプル CSV
// -----------------------------------------------------------------------
const SAMPLE_CSV = `name,area_city,categories,description,phone,website_url,instagram_url,twitter_url,status,price_range_label
渋谷古着屋,渋谷区,"ユニセックス,ヴィンテージ",渋谷の古着専門店です,03-1234-5678,https://example.com,https://instagram.com/xxx,,public,〜¥3,000
原宿セレクト,渋谷区,ユニセックス,原宿発のセレクトショップ,,,,https://twitter.com/yyy,public,¥3,001〜¥10,000
`

function downloadSampleCSV() {
  const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'shops_sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// -----------------------------------------------------------------------
// バリデーション
// -----------------------------------------------------------------------
const URL_RE = /^https?:\/\/.+/

function validateRows(
  rawRows: string[][],
  areas: Area[],
  categories: Category[],
  priceRanges: PriceRange[],
): ParsedRow[] {
  const [header, ...dataRows] = rawRows
  if (!header) return []

  const colIndex: Record<string, number> = {}
  header.forEach((h, i) => { colIndex[h.trim().toLowerCase()] = i })

  const get = (row: string[], key: string) =>
    row[colIndex[key] ?? -1]?.trim() ?? ''

  return dataRows.map((row, idx) => {
    const errors: string[] = []

    const raw = Object.fromEntries(COLUMNS.map((c) => [c, get(row, c)])) as Record<ColKey, string>

    const name = raw.name
    if (!name) errors.push('店舗名は必須です')

    const area = areas.find((a) => a.city === raw.area_city) ?? null
    if (!area) errors.push(`エリア "${raw.area_city}" が見つかりません`)

    const catNames = raw.categories.split(',').map((s) => s.trim()).filter(Boolean)
    const matchedCats = catNames
      .map((cn) => categories.find((c) => c.name === cn))
      .filter((c): c is Category => c !== undefined)
    if (catNames.length === 0) errors.push('カテゴリは1つ以上必要です')
    else if (matchedCats.length < catNames.length) {
      const missing = catNames.filter((cn) => !categories.find((c) => c.name === cn))
      errors.push(`カテゴリ "${missing.join('、')}" が見つかりません`)
    }

    const statusRaw = raw.status || 'public'
    const status = statusRaw === 'private' || statusRaw === 'pending' ? statusRaw : 'public'

    const priceRange = raw.price_range_label
      ? (priceRanges.find((p) => p.label === raw.price_range_label) ?? null)
      : null
    if (raw.price_range_label && !priceRange)
      errors.push(`価格帯 "${raw.price_range_label}" が見つかりません`)

    if (raw.website_url && !URL_RE.test(raw.website_url))
      errors.push('website_url のURL形式が不正です')
    if (raw.instagram_url && !URL_RE.test(raw.instagram_url))
      errors.push('instagram_url のURL形式が不正です')
    if (raw.twitter_url && !URL_RE.test(raw.twitter_url))
      errors.push('twitter_url のURL形式が不正です')

    return {
      rowIndex: idx + 2,
      raw, name, area,
      categories: matchedCats,
      description: raw.description,
      phone: raw.phone,
      websiteUrl: raw.website_url,
      instagramUrl: raw.instagram_url,
      twitterUrl: raw.twitter_url,
      status, priceRange, errors,
    }
  })
}

// -----------------------------------------------------------------------
// 状態バッジ
// -----------------------------------------------------------------------
const STATUS_LABEL: Record<string, string> = { public: '公開', pending: '審査中', private: '非公開' }

// -----------------------------------------------------------------------
// ページ本体
// -----------------------------------------------------------------------
const AdminShopBulkPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const { data: masterData, isLoading: masterLoading } = useMasterData()
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const { mutate: importRows, isPending } = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      if (!user) throw new Error('ログインが必要です')

      const failures: ImportResult['failures'] = []
      let success = 0

      for (const row of rows) {
        try {
          const { data: shop, error: shopError } = await supabase
            .from('shops')
            .insert({
              name: row.name,
              description: row.description || null,
              area_id: row.area!.id,
              price_range_id: row.priceRange?.id ?? null,
              phone: row.phone || null,
              website_url: row.websiteUrl || null,
              instagram_url: row.instagramUrl || null,
              twitter_url: row.twitterUrl || null,
              status: row.status,
              created_by: user.id,
            } as never)
            .select('id')
            .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

          if (shopError || !shop) {
            failures.push({ rowIndex: row.rowIndex, message: shopError?.message ?? '店舗の作成に失敗しました' })
            continue
          }

          if (row.categories.length > 0) {
            const { error: catError } = await supabase
              .from('shop_categories')
              .insert(row.categories.map((c) => ({ shop_id: shop.id, category_id: c.id })) as never) as unknown as { error: { message: string } | null }

            if (catError) {
              failures.push({ rowIndex: row.rowIndex, message: catError.message })
              continue
            }
          }

          success++
        } catch (e) {
          failures.push({ rowIndex: row.rowIndex, message: e instanceof Error ? e.message : '不明なエラー' })
        }
      }

      return { success, failures } satisfies ImportResult
    },
    onSuccess: (res) => {
      setResult(res)
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
    },
  })

  const handleFile = (file: File) => {
    setFileError(null)
    setResult(null)
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setFileError('CSVファイルを選択してください')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) { setFileError('ファイルの読み込みに失敗しました'); return }
      const rawRows = parseCSV(text)
      if (rawRows.length < 2) { setFileError('データ行がありません'); return }
      if (!masterData) { setFileError('マスターデータの読み込みが完了していません'); return }
      const rows = validateRows(rawRows, masterData.areas, masterData.categories, masterData.priceRanges)
      setParsedRows(rows)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const validRows = parsedRows.filter((r) => r.errors.length === 0)
  const errorRows = parsedRows.filter((r) => r.errors.length > 0)
  const hasErrors = errorRows.length > 0

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            IMPORT
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <button
              type="button"
              onClick={() => navigate('/admin/shops')}
              className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              店舗管理
            </button>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — Admin
            </p>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                CSVインポート
              </h1>
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="flex items-center gap-1.5 rounded-sm border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <Download className="h-3 w-3" />
                サンプル CSV
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14 space-y-12">

          {/* ── 01 フォーマット ───────────────────── */}
          <section>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">01</span>
              <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">CSV Format</span>
            </div>

            <div className="overflow-hidden border border-border">
              {/* Header row */}
              <div className="border-b border-border bg-muted/50 px-4 py-2.5 flex items-center justify-between">
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
                  Required Columns
                </span>
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                  UTF-8 · Header row required
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      {(['name', 'area_city', 'categories', 'status'] as const).map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-headline font-black uppercase tracking-wider text-primary/70">
                          {col}
                        </th>
                      ))}
                      {(['description', 'phone', 'website_url', 'instagram_url', 'twitter_url', 'price_range_label'] as const).map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-headline font-black uppercase tracking-wider text-muted-foreground/30">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-foreground/80">渋谷古着屋</td>
                      <td className="px-3 py-2.5 text-foreground/60">渋谷区</td>
                      <td className="px-3 py-2.5 text-foreground/60">"ユニセックス,ヴィンテージ"</td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-sm bg-emerald-50 px-1.5 py-0.5 font-headline text-[9px] font-black text-emerald-700">public</span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground/40">渋谷の古着店…</td>
                      <td className="px-3 py-2.5 text-muted-foreground/40">03-0000-0000</td>
                      <td className="px-3 py-2.5 text-muted-foreground/40">https://…</td>
                      <td className="px-3 py-2.5 text-muted-foreground/40">https://…</td>
                      <td className="px-3 py-2.5 text-muted-foreground/40">https://…</td>
                      <td className="px-3 py-2.5 text-muted-foreground/40">〜¥3,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border px-4 py-2 flex gap-4">
                <span className="inline-flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  必須
                </span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/40">
                  <span className="h-1.5 w-1.5 rounded-full border border-muted-foreground/30" />
                  任意
                </span>
                <span className="ml-auto text-[9px] text-muted-foreground/40">
                  status: public / pending / private
                </span>
              </div>
            </div>
          </section>

          {/* ── 02 アップロード ───────────────────── */}
          <section>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">02</span>
              <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">Upload File</span>
            </div>

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFile(file)
              }}
              className={cn(
                'relative flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed py-14 transition-all',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : fileName
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-border hover:border-primary/40 hover:bg-muted/20',
              )}
            >
              {fileName ? (
                <>
                  <FileText className={cn('h-8 w-8', 'text-emerald-500')} />
                  <div className="text-center">
                    <p className="font-headline text-sm font-black tracking-tight text-emerald-700">{fileName}</p>
                    <p className="mt-1 text-[10px] text-emerald-600/60">クリックして別のファイルを選択</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className={cn('h-8 w-8', isDragging ? 'text-primary' : 'text-muted-foreground/30')} />
                  <div className="text-center">
                    <p className={cn(
                      'font-headline text-xs font-black uppercase tracking-[0.2em]',
                      isDragging ? 'text-primary' : 'text-muted-foreground/50',
                    )}>
                      ここにCSVファイルをドラッグするか、クリックして選択してください。
                    </p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground/30">
                      文字コード: UTF-8 · ヘッダー行必須
                    </p>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>

            {/* File error */}
            {fileError && (
              <div className="mt-3 flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                <p className="text-xs font-medium text-red-700">{fileError}</p>
              </div>
            )}

            {/* Master loading */}
            {masterLoading && (
              <div className="mt-3 flex items-center gap-2 px-1">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
                <p className="text-[10px] text-muted-foreground/40">マスターデータを読み込み中…</p>
              </div>
            )}
          </section>

          {/* ── 03 プレビュー ─────────────────────── */}
          {parsedRows.length > 0 && !result && (
            <section className="wish-card-enter">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">03</span>
                  <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">Preview</span>
                </div>
                {/* Summary chips */}
                <div className="flex items-center gap-2">
                  <span className="rounded-sm bg-emerald-50 px-2 py-1 font-headline text-[9px] font-black text-emerald-700">
                    {String(validRows.length).padStart(2, '0')} VALID
                  </span>
                  {hasErrors && (
                    <span className="rounded-sm bg-red-50 px-2 py-1 font-headline text-[9px] font-black text-red-600">
                      {String(errorRows.length).padStart(2, '0')} ERRORS
                    </span>
                  )}
                  <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/30">
                    / {String(parsedRows.length).padStart(2, '0')} TOTAL
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-border">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-3 py-2.5 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 w-10">ROW</th>
                      <th className="px-3 py-2.5 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 w-8" />
                      <th className="px-3 py-2.5 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">店舗名</th>
                      <th className="px-3 py-2.5 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">エリア</th>
                      <th className="px-3 py-2.5 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">カテゴリ</th>
                      <th className="px-3 py-2.5 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">ステータス</th>
                      {hasErrors && (
                        <th className="px-3 py-2.5 text-left font-headline text-[9px] font-black uppercase tracking-[0.2em] text-red-400">エラー</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedRows.map((row) => {
                      const isValid = row.errors.length === 0
                      return (
                        <tr
                          key={row.rowIndex}
                          className={cn(
                            'transition-colors',
                            isValid ? 'hover:bg-muted/20' : 'bg-red-50/60',
                          )}
                        >
                          <td className="px-3 py-2.5 font-headline font-black tabular-nums text-muted-foreground/25">
                            {String(row.rowIndex).padStart(2, '0')}
                          </td>
                          <td className="px-3 py-2.5">
                            {isValid
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground/80">
                            {row.name || <span className="italic text-red-400">未入力</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.area?.city
                              ? <span className="text-foreground/60">{row.area.city}</span>
                              : <span className="font-medium text-red-500">{row.raw.area_city || '未入力'}</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.categories.length > 0
                              ? (
                                <span className="text-foreground/60">
                                  {row.categories.map((c) => c.name).join('、')}
                                </span>
                              )
                              : <span className="font-medium text-red-500">{row.raw.categories || '未指定'}</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={cn(
                              'rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black',
                              row.status === 'public' ? 'bg-emerald-50 text-emerald-700' :
                              row.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                              'bg-muted text-muted-foreground',
                            )}>
                              {STATUS_LABEL[row.status]}
                            </span>
                          </td>
                          {hasErrors && (
                            <td className="px-3 py-2.5 text-[10px] text-red-500">
                              {row.errors.join(' · ') || '—'}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Import action */}
              {validRows.length > 0 && (
                <div className="mt-6 flex items-center gap-4 border-t border-border pt-6">
                  <button
                    type="button"
                    onClick={() => importRows(validRows)}
                    disabled={isPending}
                    className={cn(
                      'flex items-center gap-2 bg-primary px-8 py-3 font-headline text-xs font-black uppercase tracking-[0.3em] text-white transition-opacity',
                      'hover:opacity-90 disabled:opacity-40',
                    )}
                  >
                    {isPending ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        IMPORTING...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-3.5 w-3.5" />
                        {validRows.length}件を登録
                      </>
                    )}
                  </button>
                  {hasErrors && (
                    <p className="text-[10px] text-muted-foreground/50">
                      エラーのある{errorRows.length}行はスキップされます
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── 完了 ─────────────────────────────── */}
          {result && (
            <section className="wish-card-enter space-y-6">
              <div className="flex items-baseline gap-3">
                <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">03</span>
                <span className="font-headline text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60">Result</span>
              </div>

              {/* Result banner */}
              <div className={cn(
                'border px-5 py-4',
                result.failures.length === 0
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50',
              )}>
                <p className={cn(
                  'font-headline text-2xl font-black tracking-tight',
                  result.failures.length === 0 ? 'text-emerald-700' : 'text-amber-700',
                )}>
                  {String(result.success).padStart(2, '0')} IMPORTED
                </p>
                {result.failures.length > 0 && (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    {result.failures.length}件が失敗しました
                  </p>
                )}
              </div>

              {/* Failure details */}
              {result.failures.length > 0 && (
                <div className="border border-red-200 bg-red-50/50">
                  <div className="border-b border-red-200 px-4 py-2">
                    <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-red-400">
                      FAILED ROWS
                    </span>
                  </div>
                  <div className="divide-y divide-red-100">
                    {result.failures.map((f) => (
                      <div key={f.rowIndex} className="flex items-start gap-3 px-4 py-2.5">
                        <span className="w-10 shrink-0 font-headline text-[10px] font-black tabular-nums text-red-300">
                          {String(f.rowIndex).padStart(2, '0')}行
                        </span>
                        <span className="text-[11px] text-red-600">{f.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setParsedRows([]); setResult(null); setFileName(null) }}
                  className="bg-primary px-8 py-3 font-headline text-xs font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90"
                >
                  続けてインポート
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/shops')}
                  className="px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Shop Management
                </button>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminShopBulkPage
