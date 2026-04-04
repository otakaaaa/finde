import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronDown, Save, Mail, RotateCcw, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────

interface EmailTemplate {
  id: string
  slug: string
  name: string
  subject: string
  body: string
  is_active: boolean
  variables: string[]
  updated_at: string
  updated_by: string | null
}

// ── Data hook ──────────────────────────────────────────────────

const useEmailTemplates = () =>
  useQuery({
    queryKey: ['admin-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('updated_at', { ascending: false }) as unknown as {
          data: EmailTemplate[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

// ── Sub-components ─────────────────────────────────────────────

const VariableChip = ({ name }: { name: string }) => (
  <span className="inline-flex items-center gap-1 border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground/60">
    <span className="text-muted-foreground/30">{'{'}</span>
    {name}
    <span className="text-muted-foreground/30">{'}'}</span>
  </span>
)

interface TemplateCardProps {
  template: EmailTemplate
  expanded: boolean
  onToggle: () => void
  onSave: (id: string, subject: string, body: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
  isSaving: boolean
}

const TemplateCard = ({
  template,
  expanded,
  onToggle,
  onSave,
  onToggleActive,
  isSaving,
}: TemplateCardProps) => {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)

  const isDirty = subject !== template.subject || body !== template.body

  const handleReset = () => {
    setSubject(template.subject)
    setBody(template.body)
  }

  return (
    <div
      className={cn(
        'wish-card-enter border-l-[3px] bg-white editorial-shadow',
        template.is_active ? 'border-l-emerald-400' : 'border-l-border',
      )}
    >
      {/* ── Summary row ── */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        {/* Status dot */}
        <span className={cn(
          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
          template.is_active ? 'bg-emerald-400' : 'bg-border',
        )} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-headline text-[13px] font-black tracking-tight text-foreground/80">
              {template.name}
            </p>
            <span className="font-mono text-[10px] text-muted-foreground/40">
              {template.slug}
            </span>
            {!template.is_active && (
              <span className="rounded-sm bg-muted px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider text-muted-foreground/40">
                無効
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground/45">
            {template.subject}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[9px] text-muted-foreground/25 tabular-nums">
            {new Date(template.updated_at).toLocaleDateString('ja-JP', {
              month: '2-digit',
              day: '2-digit',
            })}
          </span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 text-muted-foreground/25 transition-transform duration-200',
            expanded && 'rotate-180',
          )} />
        </div>
      </button>

      {/* ── Expanded editor ── */}
      {expanded && (
        <div className="border-t border-border">
          {/* Variables strip */}
          {template.variables.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2.5">
              <span className="font-headline text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                使用可能な変数
              </span>
              {template.variables.map((v) => (
                <VariableChip key={v} name={v} />
              ))}
            </div>
          )}

          <div className="space-y-4 px-4 pb-4 pt-4">
            {/* Subject field */}
            <div>
              <label className="mb-1.5 block font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
                件名 (Subject)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-border bg-white px-3 py-2 text-[13px] text-foreground focus:border-foreground/30 focus:outline-none focus:ring-0 transition-colors"
              />
            </div>

            {/* Body field */}
            <div>
              <label className="mb-1.5 block font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
                本文 (Body)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                className={cn(
                  'w-full border border-border bg-muted/20 px-3 py-2.5',
                  'font-mono text-[12px] leading-[1.9] text-foreground/75',
                  'focus:border-foreground/30 focus:bg-white focus:outline-none focus:ring-0 transition-all resize-y',
                )}
              />
              <p className="mt-1 text-right font-mono text-[9px] text-muted-foreground/25 tabular-nums">
                {body.length} chars
              </p>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              {/* Toggle active */}
              <button
                type="button"
                onClick={() => onToggleActive(template.id, !template.is_active)}
                disabled={isSaving}
                className={cn(
                  'flex items-center gap-1.5 font-headline text-[9px] font-black uppercase tracking-[0.25em] transition-colors disabled:opacity-40',
                  template.is_active
                    ? 'text-emerald-600 hover:text-muted-foreground'
                    : 'text-muted-foreground/40 hover:text-emerald-600',
                )}
              >
                {template.is_active ? (
                  <ToggleRight className="h-3.5 w-3.5" />
                ) : (
                  <ToggleLeft className="h-3.5 w-3.5" />
                )}
                {template.is_active ? '有効' : '無効'}
              </button>

              <div className="flex items-center gap-2">
                {/* Reset */}
                {isDirty && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isSaving}
                    className="flex h-8 items-center gap-1.5 border border-border px-3 font-headline text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 transition-colors hover:border-foreground/20 hover:text-foreground/70 disabled:opacity-40"
                  >
                    <RotateCcw className="h-3 w-3" />
                    リセット
                  </button>
                )}

                {/* Save */}
                <button
                  type="button"
                  onClick={() => onSave(template.id, subject, body)}
                  disabled={!isDirty || isSaving}
                  className={cn(
                    'flex h-8 items-center gap-1.5 px-4 font-headline text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40',
                    isDirty
                      ? 'bg-primary text-white hover:opacity-85'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isSaving ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const AdminEmailTemplatesPage = () => {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: templates, isLoading, error } = useEmailTemplates()

  const { mutate: saveTemplate, isPending: isSaving } = useMutation({
    mutationFn: async ({
      id,
      subject,
      body,
    }: {
      id: string
      subject: string
      body: string
    }) => {
      const { error } = await supabase
        .from('email_templates')
        .update({ subject, body } as never)
        .eq('id', id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] }),
  })

  const { mutate: toggleActive, isPending: isToggling } = useMutation({
    mutationFn: async ({
      id,
      isActive,
    }: {
      id: string
      isActive: boolean
    }) => {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: isActive } as never)
        .eq('id', id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] }),
  })

  const isMutating = isSaving || isToggling

  const activeCount = templates?.filter((t) => t.is_active).length ?? 0
  const totalCount = templates?.length ?? 0

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            MAIL
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
              メールテンプレート
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Meta bar */}
          {!isLoading && !error && (
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/30" />
                <span className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  {activeCount} / {totalCount} 有効
                </span>
              </div>
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground/30">
                テンプレートを展開して編集してください
              </span>
            </div>
          )}

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
          {!isLoading && !error && templates?.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                No Templates
              </span>
              <p className="text-xs text-muted-foreground/40">テンプレートがありません</p>
            </div>
          )}

          {/* Template list */}
          {!isLoading && templates && templates.length > 0 && (
            <div className="space-y-1.5">
              {templates.map((template, i) => (
                <div key={template.id} style={{ animationDelay: `${i * 30}ms` }}>
                  <TemplateCard
                    template={template}
                    expanded={expandedId === template.id}
                    onToggle={() =>
                      setExpandedId(expandedId === template.id ? null : template.id)
                    }
                    onSave={(id, subject, body) => saveTemplate({ id, subject, body })}
                    onToggleActive={(id, isActive) => toggleActive({ id, isActive })}
                    isSaving={isMutating}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footer note */}
          {!isLoading && templates && templates.length > 0 && (
            <p className="mt-8 text-center font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/20">
              変数は {'{{変数名}}'} 形式で本文中に記述します
            </p>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminEmailTemplatesPage
