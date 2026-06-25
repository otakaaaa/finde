import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const MAX_NAME_LENGTH = 30

const SetupProfilePage = () => {
  const navigate = useNavigate()
  const { user, loading, refreshUser } = useAuth()

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 既にアカウント名が設定済みのユーザーはマイページへ
  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/auth/login', { replace: true })
      return
    }
    if (user.displayName && user.displayName.trim().length > 0) {
      navigate('/', { replace: true })
    }
  }, [loading, user, navigate])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setError('アカウント名を入力してください')
      return
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`アカウント名は${MAX_NAME_LENGTH}文字以内で入力してください`)
      return
    }

    setSaving(true)
    setError(null)

    const [{ error: dbError }, { error: authError }] = await Promise.all([
      supabase
        .from('users')
        .update({ display_name: trimmed, updated_at: new Date().toISOString() } as never)
        .eq('id', user.id),
      supabase.auth.updateUser({ data: { name: trimmed, full_name: trimmed } }),
    ])

    if (dbError || authError) {
      setError('設定に失敗しました。再度お試しください。')
      setSaving(false)
      return
    }

    await refreshUser()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col justify-center bg-white px-8 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-[360px]">
        <div className="mb-10">
          <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
            ようこそ FINDE へ
          </p>
          <h1 className="font-headline text-2xl font-black tracking-tight text-foreground">
            アカウント名を設定
          </h1>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            FINDEにて表示される名前です。あとからマイページで変更できます。
          </p>
        </div>

        {error && (
          <div className="wish-card-enter mb-6 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
            <p className="text-[11px] font-medium text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label
              htmlFor="display-name"
              className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/45"
            >
              アカウント名
            </label>
            <input
              id="display-name"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="アカウント名を入力"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => {
                setName(e.target.value)
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
            disabled={saving || name.trim().length === 0}
            className="w-full bg-primary px-6 py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            {saving ? '設定中…' : '設定して始める'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SetupProfilePage
