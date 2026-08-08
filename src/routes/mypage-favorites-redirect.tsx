import { redirect } from 'react-router'

/** 旧URL /mypage/favorites → /mypage/follows（店舗フォローへの改名に伴うリダイレクト） */
export const loader = () => redirect('/mypage/follows', 301)

export default function MypageFavoritesRedirect() {
  return null
}
