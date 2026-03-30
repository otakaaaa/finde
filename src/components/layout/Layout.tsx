import { Outlet } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'

export const Layout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
)
