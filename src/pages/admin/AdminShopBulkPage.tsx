import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
// サンプル CSV 生成
// -----------------------------------------------------------------------
const SAMPLE_CSV = `name,area_city,categories,description,phone,website_url,instagram_url,twitter_url,status,price_range_label
渋谷古着屋,渋谷区,"古着,ヴィンテージ",渋谷の古着専門店です,03-1234-5678,https://example.com,https://instagram.com/xxx,,public,〜¥3,000
原宿セレクト,渋谷区,セレクトショップ,原宿発のセレクトショップ,,,,https://twitter.com/yyy,public,¥3,001〜¥10,000
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
  header.forEach((h, i) => {
    colIndex[h.trim().toLowerCase()] = i
  })

  const get = (row: string[], key: string) =>
    row[colIndex[key] ?? -1]?.trim() ?? ''

  return dataRows.map((row, idx) => {
    const errors: string[] = []

    const raw = Object.fromEntries(
      COLUMNS.map((c) => [c, get(row, c)])
    ) as Record<ColKey, string>

    const name = raw.name
    if (!name) errors.push('店舗名は必須です')

    const area = areas.find((a) => a.city === raw.area_city) ?? null
    if (!area) errors.push(`エリア "${raw.area_city}" が見つかりません`)

    const catNames = raw.categories
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const matchedCats = catNames
      .map((cn) => categories.find((c) => c.name === cn))
      .filter((c): c is Category => c !== undefined)
    if (catNames.length === 0) errors.push('カテゴリは1つ以上必要です')
    else if (matchedCats.length < catNames.length) {
      const missing = catNames.filter((cn) => !categories.find((c) => c.name === cn))
      errors.push(`カテゴリ "${missing.join('、')}" が見つかりません`)
    }

    const statusRaw = raw.status || 'public'
    const status =
      statusRaw === 'private' || statusRaw === 'pending' ? statusRaw : 'public'

    const priceRange =
      raw.price_range_label
        ? (priceRanges.find((p) => p.label === raw.price_range_label) ?? null)
        : null
    if (raw.price_range_label && !priceRange) {
      errors.push(`価格帯 "${raw.price_range_label}" が見つかりません`)
    }

    if (raw.website_url && !URL_RE.test(raw.website_url))
      errors.push('website_url のURL形式が不正です')
    if (raw.instagram_url && !URL_RE.test(raw.instagram_url))
      errors.push('instagram_url のURL形式が不正です')
    if (raw.twitter_url && !URL_RE.test(raw.twitter_url))
      errors.push('twitter_url のURL形式が不正です')

    return {
      rowIndex: idx + 2,
      raw,
      name,
      area,
      categories: matchedCats,
      description: raw.description,
      phone: raw.phone,
      websiteUrl: raw.website_url,
      instagramUrl: raw.instagram_url,
      twitterUrl: raw.twitter_url,
      status,
      priceRange,
      errors,
    }
  })
}

// -----------------------------------------------------------------------
// ページ本体
// -----------------------------------------------------------------------
const AdminShopBulkPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
              .insert(
                row.categories.map((c) => ({ shop_id: shop.id, category_id: c.id })) as never
              ) as unknown as { error: { message: string } | null }

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
  const hasErrors = parsedRows.some((r) => r.errors.length > 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <button
        onClick={() => navigate('/admin/shops')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        店舗管理に戻る
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">CSV一括登録</h1>
        <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
          <Download className="mr-1.5 h-4 w-4" />
          サンプルCSV
        </Button>
      </div>

      {/* Upload area */}
      <div
        className="mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 py-12 transition-colors hover:bg-muted/50"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">CSVファイルをドロップ、またはクリックして選択</p>
        <p className="mt-1 text-xs text-muted-foreground">
          文字コード: UTF-8 / ヘッダー行必須
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {fileError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      {masterLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Preview table */}
      {parsedRows.length > 0 && !result && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              全{parsedRows.length}行 / 有効: <span className="font-medium text-green-600">{validRows.length}</span>行 / エラー: <span className="font-medium text-red-600">{parsedRows.length - validRows.length}</span>行
            </p>
            {validRows.length > 0 && (
              <Button onClick={() => importRows(validRows)} disabled={isPending}>
                {isPending
                  ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />登録中...</>
                  : `有効な${validRows.length}件を登録`}
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">行</th>
                  <th className="px-3 py-2 text-left font-medium">状態</th>
                  <th className="px-3 py-2 text-left font-medium">店舗名</th>
                  <th className="px-3 py-2 text-left font-medium">エリア</th>
                  <th className="px-3 py-2 text-left font-medium">カテゴリ</th>
                  <th className="px-3 py-2 text-left font-medium">ステータス</th>
                  {hasErrors && <th className="px-3 py-2 text-left font-medium text-red-600">エラー</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedRows.map((row) => (
                  <tr key={row.rowIndex} className={row.errors.length > 0 ? 'bg-red-50' : 'hover:bg-muted/40'}>
                    <td className="px-3 py-2 text-muted-foreground">{row.rowIndex}</td>
                    <td className="px-3 py-2">
                      {row.errors.length === 0
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : <XCircle className="h-4 w-4 text-red-500" />}
                    </td>
                    <td className="px-3 py-2 font-medium">{row.name || '—'}</td>
                    <td className="px-3 py-2">{row.area?.city ?? <span className="text-red-600">{row.raw.area_city}</span>}</td>
                    <td className="px-3 py-2">
                      {row.categories.length > 0
                        ? row.categories.map((c) => c.name).join('、')
                        : <span className="text-red-600">{row.raw.categories || '未指定'}</span>}
                    </td>
                    <td className="px-3 py-2">{row.status === 'public' ? '公開' : row.status === 'pending' ? '審査中' : '非公開'}</td>
                    {hasErrors && (
                      <td className="px-3 py-2 text-red-600">{row.errors.join(' / ')}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Import result */}
      {result && (
        <div className="space-y-4">
          <Alert className={result.failures.length === 0 ? 'border-green-200 bg-green-50' : undefined}>
            <AlertDescription>
              <span className="font-medium text-green-700">{result.success}件</span> 登録しました。
              {result.failures.length > 0 && (
                <span className="ml-2 text-red-600">{result.failures.length}件 失敗しました。</span>
              )}
            </AlertDescription>
          </Alert>
          {result.failures.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-1">
              {result.failures.map((f) => (
                <div key={f.rowIndex}>{f.rowIndex}行目: {f.message}</div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => { setParsedRows([]); setResult(null) }}>
              続けてインポート
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/shops')}>
              店舗管理へ戻る
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminShopBulkPage
