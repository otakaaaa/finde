import { Link } from 'react-router'
import { Seo } from '@/components/seo/Seo'

const NotFoundPage = () => (
  <div className="flex min-h-[calc(100vh-56px)]">
    <Seo title="ページが見つかりません" noindex />
    {/* 左パネル */}
    <div className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 78% 18%, rgba(255,255,255,0.12) 0, transparent 26%), linear-gradient(145deg, transparent 44%, rgba(255,255,255,0.05) 44%, rgba(255,255,255,0.05) 47%, transparent 47%)',
        }}
      />

      <div className="pointer-events-none absolute -bottom-8 -left-6 select-none">
        <span
          className="font-headline font-black leading-none tracking-tighter text-white/[0.05]"
          style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}
        >
          404
        </span>
      </div>

      <div className="relative">
        <p className="font-headline text-[9px] font-black uppercase tracking-[0.6em] text-white/30">
          FINDE
        </p>
      </div>

      <div className="relative">
        <div className="mb-6 h-px w-10 bg-white/20" />
        <h2 className="mb-5 font-headline text-[64px] font-black leading-[0.88] tracking-tighter text-white">
          404
        </h2>
        <p className="max-w-[240px] text-[12px] leading-[1.8] text-white/35">
          お探しのページは見つかりませんでした。
        </p>
      </div>

      <div className="relative flex items-center gap-3">
        <span className="h-[2px] w-6 bg-white/25" />
        <span className="font-headline text-[8px] font-black uppercase tracking-[0.5em] text-white/20">
          Page Not Found
        </span>
      </div>
    </div>

    {/* 右パネル */}
    <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-white px-8 py-12 sm:px-12 md:px-16 lg:px-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="mb-10 lg:hidden">
        <p className="mb-1 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
          FINDE
        </p>
        <h1 className="font-headline text-5xl font-black leading-none tracking-tight text-foreground">
          404
        </h1>
      </div>

      <div className="relative mx-auto w-full max-w-[380px]">
        <div className="wish-card-enter mb-8">
          <p className="mb-2 font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/35">
            Page not found
          </p>
          <h1 className="font-headline text-2xl font-black leading-tight tracking-tight text-foreground">
            ページが見つかりません。
          </h1>
        </div>

        <div className="wish-card-enter mb-8 border-l-[3px] border-l-border bg-muted/35 px-4 py-4">
          <p className="font-headline text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
            What happened?
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-foreground/70">
            お探しのページは移動・削除されたか、URLが間違っている可能性があります。
          </p>
        </div>

        <div className="wish-card-enter space-y-3">
          <Link
            to="/"
            className="block w-full bg-primary py-4 text-center font-headline text-[10px] font-black uppercase tracking-[0.4em] text-white transition-opacity hover:opacity-85"
          >
            トップページへ
          </Link>
          <Link
            to="/shops"
            className="block w-full border border-border py-4 text-center font-headline text-[10px] font-black uppercase tracking-[0.4em] text-foreground transition-colors hover:bg-muted/50"
          >
            ショップを探す
          </Link>
        </div>
      </div>
    </div>
  </div>
)

export default NotFoundPage
