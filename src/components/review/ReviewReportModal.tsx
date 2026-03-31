import { useState } from 'react'
import { Flag, X, Send, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

type ReportReason = 'false_info' | 'harassment' | 'irrelevant' | 'other'

interface ReasonOption {
  value: ReportReason
  label: string
  sublabel: string
}

const REASONS: ReasonOption[] = [
  { value: 'false_info',  label: '虚偽情報',    sublabel: '事実と異なる情報が含まれている' },
  { value: 'harassment',  label: 'ハラスメント', sublabel: '不適切・攻撃的な内容が含まれている' },
  { value: 'irrelevant',  label: '無関係な内容', sublabel: '店舗と関係のない投稿' },
  { value: 'other',       label: 'その他',       sublabel: '上記に当てはまらない問題' },
]

export const ReviewReportModal = () => {
  const { reviewReportModalReviewId, closeReviewReportModal } = useUiStore()
  const { user } = useAuth()

  const [reason, setReason] = useState<ReportReason | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!reviewReportModalReviewId) return null

  const handleClose = () => {
    closeReviewReportModal()
    setTimeout(() => {
      setReason(null)
      setNote('')
      setDone(false)
      setError(null)
    }, 250)
  }

  const handleSubmit = async () => {
    if (!reason || !user) return
    setSubmitting(true)
    setError(null)

    const { error: err } = await supabase
      .from('review_reports')
      .insert({
        review_id: reviewReportModalReviewId,
        reported_by: user.id,
        reason,
        note: note.trim() || null,
      } as never) as unknown as { data: unknown; error: { message: string; code: string } | null }

    setSubmitting(false)

    if (err) {
      setError(err.code === '23505'
        ? 'このレビューはすでに通報済みです'
        : '通報に失敗しました。もう一度お試しください')
      return
    }

    setDone(true)
  }

  return (
    <div
      className="modal-backdrop-enter fixed inset-0 z-[100] flex items-center justify-center bg-foreground/65 px-4 backdrop-blur-[2px]"
      onClick={handleClose}
    >
      <div
        className="modal-enter relative w-full max-w-[420px] bg-white editorial-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-[3px] w-full bg-foreground" />

        {done ? (
          /* ── Success state ───────────────────────── */
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="font-headline text-xl font-black leading-none tracking-tight text-foreground">
              通報を受け付けました
            </h2>
            <p className="mt-3 text-[11px] leading-[1.8] text-muted-foreground/60">
              ご報告ありがとうございます。<br />
              内容を確認後、適切に対処いたします。
            </p>
            <button
              onClick={handleClose}
              className="mt-7 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 transition-colors hover:text-foreground"
            >
              閉じる
            </button>
          </div>
        ) : (
          <>
            {/* ── Header ─────────────────────────────── */}
            <div className="px-6 pb-4 pt-6">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.5em] text-muted-foreground/40">
                — Report
              </p>
              <h2 className="font-headline text-2xl font-black leading-none tracking-tight text-foreground">
                REVIEW REPORT
              </h2>
              <p className="mt-2.5 text-[11px] leading-[1.7] text-muted-foreground/60">
                問題のある内容を報告してください。<br />
                運営にて確認・対処いたします。
              </p>
            </div>

            <div className="mx-6 h-px bg-border" />

            {/* ── Reason ─────────────────────────────── */}
            <div className="px-6 pt-4 pb-4">
              <p className="mb-3 font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/35">
                通報理由 <span className="text-red-500">*</span>
              </p>
              <div className="space-y-1.5">
                {REASONS.map((r) => {
                  const selected = reason === r.value
                  return (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={cn(
                        'flex w-full items-center gap-3 border px-3 py-2.5 text-left transition-all duration-150',
                        selected
                          ? 'border-foreground bg-foreground'
                          : 'border-border bg-white hover:border-foreground/20 hover:bg-muted/40',
                      )}
                    >
                      {/* Radio dot */}
                      <div className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        selected ? 'border-white' : 'border-border',
                      )}>
                        {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>

                      <div className="min-w-0">
                        <p className={cn(
                          'font-headline text-[11px] font-black tracking-wide',
                          selected ? 'text-white' : 'text-foreground/80',
                        )}>
                          {r.label}
                        </p>
                        <p className={cn(
                          'text-[9px]',
                          selected ? 'text-white/55' : 'text-muted-foreground/45',
                        )}>
                          {r.sublabel}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Note ───────────────────────────────── */}
            <div className="px-6 pb-4">
              <p className="mb-2 font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/35">
                補足コメント
                <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/25">
                  optional
                </span>
              </p>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="具体的な問題点があればご記入ください…"
                maxLength={500}
                className={cn(
                  'w-full resize-none border border-border bg-white px-3 py-2.5',
                  'text-xs leading-relaxed text-foreground/80 placeholder:text-muted-foreground/30',
                  'transition-colors focus:border-foreground/30 focus:outline-none',
                )}
              />
              <p className="mt-1 text-right font-headline text-[9px] tabular-nums text-muted-foreground/20">
                {note.length} / 500
              </p>
            </div>

            {/* ── Error ──────────────────────────────── */}
            {error && (
              <div className="mx-6 mb-4 border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-[11px] font-medium text-red-700">{error}</p>
              </div>
            )}

            <div className="mx-6 h-px bg-border" />

            {/* ── Actions ────────────────────────────── */}
            <div className="flex items-center justify-end gap-2 px-6 py-4">
              <button
                onClick={handleClose}
                disabled={submitting}
                className="h-9 px-4 font-headline text-[10px] font-black uppercase tracking-wider text-muted-foreground/45 transition-colors hover:text-foreground disabled:opacity-30"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className={cn(
                  'flex h-9 items-center gap-2 bg-foreground px-5',
                  'font-headline text-[10px] font-black uppercase tracking-wider text-white',
                  'transition-opacity hover:opacity-75 disabled:opacity-30',
                )}
              >
                {submitting ? (
                  <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                通報する
              </button>
            </div>
          </>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground/20 transition-colors hover:text-muted-foreground"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
