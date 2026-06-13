import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useFavoriteStatus, useToggleFavorite } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

interface ShopReelFavoriteButtonProps {
  shopId: string
}

export const ShopReelFavoriteButton = ({ shopId }: ShopReelFavoriteButtonProps) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useUiStore()
  const { data: isFavorited = false } = useFavoriteStatus(shopId)
  const { mutate: toggleFavorite } = useToggleFavorite(shopId)

  const handleClick = () => {
    if (!user) {
      addToast({ title: 'お気に入りにはログインが必要です', variant: 'destructive' })
      navigate('/auth/login')
      return
    }
    toggleFavorite(isFavorited)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 border px-4 py-2.5 text-sm font-bold transition-all',
        isFavorited
          ? 'border-white/50 bg-white/20 text-white'
          : 'border-white/30 bg-black/20 text-white/80 hover:border-white/50 hover:text-white'
      )}
    >
      <Heart className={cn('h-4 w-4', isFavorited && 'fill-white')} />
      {isFavorited ? '保存済み' : 'お気に入り'}
    </button>
  )
}
