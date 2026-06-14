import { useMyBookmarks } from '@/hooks/useShareBookmarks'
import { SharePostCard } from '@/components/share/SharePostCard'
import { ShareMypageNav } from '@/components/share/ShareMypageNav'
import { Seo } from '@/components/seo/Seo'

const MyShareBookmarksPage = () => {
  const { data: posts, isLoading } = useMyBookmarks()

  return (
    <div className="bg-background">
      <Seo title="シャレ活のブックマーク" description="ブックマークしたシャレ活を見返せます。" path="/mypage/share/bookmarks" noindex />

      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <h1 className="mb-6 font-headline text-2xl font-black tracking-tight text-foreground">シャレ活</h1>
        <ShareMypageNav />

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground/40">読み込み中…</p>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <SharePostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground/40">ブックマークした投稿はありません。</p>
        )}
      </div>
    </div>
  )
}

export default MyShareBookmarksPage
