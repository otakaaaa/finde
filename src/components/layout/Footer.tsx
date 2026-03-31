import { Link } from 'react-router'

export const Footer = () => (
  <footer className="border-t border-border/60 bg-background py-10 text-sm text-muted-foreground">
    <div className="mx-auto max-w-5xl px-4">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-black text-white leading-none select-none">
            服
          </span>
          <span className="font-black text-foreground tracking-tight">フクナビ</span>
        </div>
        <nav className="flex gap-6">
          <Link to="/terms" className="hover:text-foreground transition-colors">利用規約</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">プライバシーポリシー</Link>
          <Link to="/listing-request" className="hover:text-foreground transition-colors">店舗掲載申請</Link>
        </nav>
        <span className="text-xs">© 2026 フクナビ</span>
      </div>
    </div>
  </footer>
)
