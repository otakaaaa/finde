import { useState } from 'react'
import { useAuthActions } from '@/hooks/useAuthActions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ResetPasswordPage = () => {
  const { loading, error, updatePassword } = useAuthActions()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (password !== passwordConfirm) {
      setValidationError('パスワードが一致しません')
      return
    }
    if (password.length < 8) {
      setValidationError('パスワードは8文字以上で入力してください')
      return
    }

    await updatePassword(password)
  }

  const displayedError = validationError ?? error

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>新しいパスワードを設定</CardTitle>
            <CardDescription>新しいパスワードを入力してください</CardDescription>
          </CardHeader>

          <CardContent>
            {displayedError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{displayedError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">新しいパスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8文字以上"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">新しいパスワード（確認）</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="パスワードを再入力"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '更新中...' : 'パスワードを更新'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordPage
