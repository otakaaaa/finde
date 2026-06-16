import { useNavigate } from 'react-router'
import { SharePostForm } from '@/components/share/SharePostForm'
import { Seo } from '@/components/seo/Seo'

const SharePostNewPage = () => {
  const navigate = useNavigate()

  return (
    <div>
      <Seo title="シャレ活を投稿" description="あなたのシャレ活を投稿しましょう。" path="/share/new" noindex />

      {/* Minimal editorial header */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 md:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/35 transition-colors hover:text-foreground/70"
          >
            ← Back
          </button>
          <p className="font-headline text-[9px] font-black uppercase tracking-[0.5em] text-foreground/25">
            — Share Post —
          </p>
          <div className="w-14" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        <SharePostForm mode="create" />
      </div>
    </div>
  )
}

export default SharePostNewPage
