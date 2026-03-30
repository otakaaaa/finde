import { Link } from 'react-router'

export const Footer = () => (
  <footer className="border-t bg-white py-8 text-sm text-muted-foreground">
    <div className="mx-auto max-w-5xl px-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <span className="font-semibold text-foreground">フクナビ</span>
        <nav className="flex gap-4">
          <Link to="/terms" className="hover:text-foreground">利用規約</Link>
          <Link to="/privacy" className="hover:text-foreground">プライバシーポリシー</Link>
          <Link to="/listing-request" className="hover:text-foreground">店舗掲載申請</Link>
        </nav>
        <span>© 2025 フクナビ</span>
      </div>
    </div>
  </footer>
)
