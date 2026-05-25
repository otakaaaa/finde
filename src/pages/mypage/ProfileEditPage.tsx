import { useState } from 'react'
import { useNavigate } from 'react-router'
import { User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const MAX_NAME_LENGTH = 30

const ProfileEditPage = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [name, setName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setError('名前を入力してください')
      return
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`名前は${MAX_NAME_LENGTH}文字以内で入力してください`)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    const { error: updateError } = await supabase
      .from('users')
      .update({ display_name: trimmed, updated_at: new Date().toISOString() } as never)
      .eq('id', user.id)

    if (updateError) {
      setError('更新に失敗しました。再度お試しください。')
      setSaving(false)
      return
    }

    await refreshUser()
    setSuccess(true)
    setSaving(false)
  }

  return (
    <div className="bg-background">
      {/* ── Header ───────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-10 pt-10 md:px-16">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end select-none overflow-hidden pr-4 md:pr-10">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(120px, 22vw, 240px)' }}
          >
            Edit
          </span>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-1.5 border border-white/10 px-3 py-1">
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.5em] text-white/40">
              Profile
            </span>
          </div>

          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
              — Settings
            </p>
            <h1 className="font-headline text-2xl font-black leading-none tracking-tight text-white md:text-3xl">
              プロフィール編集
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-16">
        <div className="wish-card-enter">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              基本情報
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Status banner */}
          <div className="mb-6 flex items-center gap-4 border border-border bg-muted/30 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground/40">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-headline text-[12px] font-black uppercase tracking-[0.15em] text-foreground/80">
                表示名
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                レビューや投稿に表示される名前です
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
              <p className="text-[11px] font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 border-l-[3px] border-l-emerald-400 bg-emerald-50 px-4 py-3">
              <p className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
                更新しました
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="display-name"
                className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/45"
              >
                名前
              </label>
              <input
                id="display-name"
                type="text"
                autoComplete="name"
                placeholder="表示名を入力"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => {
                  setName(e.target.value)
                  setSuccess(false)
                  setError(null)
                }}
                className="w-full border-b border-border bg-transparent pb-2.5 pt-1 text-[18px] font-black tracking-tight text-foreground placeholder:text-muted-foreground/20 focus:border-foreground focus:outline-none"
              />
              <p className="mt-1.5 text-right text-[10px] text-muted-foreground/30">
                {name.trim().length} / {MAX_NAME_LENGTH}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || name.trim() === (user?.displayName ?? '')}
              className="bg-primary px-6 py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              {saving ? '保存中…' : '保存する'}
            </button>
          </form>
        </div>

        {/* ── Back link ────────────────────────────── */}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/35 transition-colors hover:text-foreground/60"
          >
            ← マイページへ戻る
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileEditPage
