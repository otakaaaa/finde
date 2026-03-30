import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const LinkAccountPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const provider = searchParams.get('provider') ?? 'google'
  const email = searchParams.get('email') ?? ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLink = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/auth/login')
  }

  const providerLabel = provider === 'google' ? 'Google' : provider

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>アカウントの連携確認</CardTitle>
            <CardDescription>
              {email && <span className="font-medium">{email}</span>}
              {email && 'のメールアドレスで'}既存のアカウントが見つかりました
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription>
                {providerLabel}アカウントを既存のアカウントに連携しますか？
                連携すると、どちらの方法でもログインできるようになります。
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-2">
              <Button onClick={handleLink} disabled={loading} className="w-full">
                {loading ? '連携中...' : `${providerLabel}アカウントを連携する`}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="w-full"
              >
                キャンセル
              </Button>
            </div>
          </CardContent>

          <CardFooter className="justify-center">
            <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-primary">
              ログインページへ戻る
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default LinkAccountPage
