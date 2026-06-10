import { Wrench } from 'lucide-react'
import { MAINTENANCE_UNTIL } from '@/config/features'

export const MaintenancePage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
    <div className="flex max-w-md flex-col items-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Wrench className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">メンテナンス中</h1>
        <p className="text-muted-foreground">
          サービス向上のため、現在メンテナンスを行っています。
          <br />
          ご不便をおかけして申し訳ございません。
        </p>
      </div>
      <div className="rounded-lg border bg-muted/50 px-6 py-4 text-sm">
        <span className="text-muted-foreground">復旧見込み：</span>
        <span className="ml-1 font-medium">{MAINTENANCE_UNTIL ?? '未定'}</span>
      </div>
    </div>
  </div>
)
