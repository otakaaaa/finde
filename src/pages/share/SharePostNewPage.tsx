import { useNavigate } from 'react-router'
import { SharePostForm } from '@/components/share/SharePostForm'
import { Seo } from '@/components/seo/Seo'

const SharePostNewPage = () => {
  const navigate = useNavigate()

  return (
    <div>
      <Seo title="シャレ活を投稿" description="あなたのシャレ活を投稿しましょう。" path="/share/new" noindex />

      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            POST
          </span>
        </div>
        <div className="relative mx-auto max-w-2xl pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
          >
            ← Back
          </button>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Share</p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">シャレ活を投稿</h1>
        </div>
      </section>

      <div className="bg-background">
        <div className="mx-auto max-w-2xl px-4 py-10 md:px-8 md:py-14">
          <SharePostForm mode="create" />
        </div>
      </div>
    </div>
  )
}

export default SharePostNewPage
