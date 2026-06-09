import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShopSearchBarProps {
  initialQuery?: string
  className?: string
}

export const ShopSearchBar = ({ initialQuery = '', className }: ShopSearchBarProps) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialQuery)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/shops?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex items-center overflow-hidden rounded-2xl border border-border bg-white editorial-shadow',
        className
      )}
    >
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="ブランド名・店舗名・エリアで検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full bg-transparent pl-11 pr-4 text-[16px] placeholder:text-muted-foreground focus:outline-none md:text-sm"
        />
      </div>
      <div className="pr-2">
        <button
          type="submit"
          disabled={!query.trim()}
          className="h-9 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          検索する
        </button>
      </div>
    </form>
  )
}
