import { useState } from 'react'
import { Link } from 'react-router'
import { useAuthActions } from '@/hooks/useAuthActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ForgotPasswordPage = () => {
  const { loading, error, sendPasswordReset } = useAuthActions()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await sendPasswordReset(email)
    if (success) setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>メールを送信しました</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  {email} にパスワードリセット用のリンクを送信しました。メールをご確認ください。
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="justify-center">
              <Link to="/auth/login" className="text-sm text-primary hover:underline">
                ログインページへ戻る
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>パスワードをお忘れの方</CardTitle>
            <CardDescription>
              登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '送信中...' : 'リセットリンクを送信'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <Link to="/auth/login" className="text-sm text-primary hover:underline">
              ログインページへ戻る
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
