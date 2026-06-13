import { Link } from 'react-router'
import { Seo } from '@/components/seo/Seo'

// ── Section heading ───────────────────────────────────────────────────────

const SectionHeading = ({ num, title }: { num: string; title: string }) => (
  <div className="mb-8 flex items-baseline gap-4">
    <span className="font-headline text-[11px] font-black tabular-nums text-muted-foreground/20">
      {num}
    </span>
    <h2 className="font-headline text-xl font-black leading-none tracking-tight text-foreground">
      {title}
    </h2>
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────

const AboutPage = () => (
  <div className="bg-background">
    <Seo
      title="FINDEについて"
      description="FINDEは、店舗と取り扱いブランドを比較しながら「行きたいお店」が見つかる服屋検索サービスです。サービスの想いと特徴をご紹介します。"
      path="/about"
    />

    {/* ── Hero ────────────────────────────────────────────── */}
    <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
      <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
        <span
          className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
          style={{ fontSize: 'clamp(72px, 13vw, 150px)' }}
        >
          STORY
        </span>
      </div>
      <div className="relative mx-auto max-w-2xl">
        <div className="pb-8 pt-2">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.5em] text-white/30">
            — Story
          </p>
          <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
            このサービスについて
          </h1>
          <p className="mt-3 text-[11px] text-white/30">
            FINDEを作った背景
          </p>
        </div>
      </div>
    </section>

    {/* ── Body ────────────────────────────────────────────── */}
    <div className="mx-auto max-w-2xl px-4 py-16 md:px-16 md:py-20">
      <div className="space-y-0 divide-y divide-border">

        {/* ── 01 きっかけ ──────────────────────────────────── */}
        <section className="py-14 first:pt-0">
          <SectionHeading num="01" title="きっかけ" />
          <div className="space-y-5 text-sm leading-[1.95] text-foreground/70">
            <p>
              洋服が好きで、おしゃれをすることが自分の趣味のひとつです。今でこそ気に入っているセレクトショップが何軒かあり、定期的に顔を出すような関係になっていますが、そこにたどり着くまでには、なかなか時間がかかりました。
            </p>
            <p>
              Instagramで「セレクトショップ 近く」と検索しても、求めているものはなかなかヒットしない。旅先や初めて訪れるエリアで「この辺に良い古着屋はないかな」と思っても、信頼できるまとまった情報がどこにもない。雑誌の特集やブログ記事を探し回るけれど、情報はすぐに古くなる。そんな経験を何度も繰り返してきました。
            </p>
            <p>
              「自分が探していたものを、自分で作ればいい。」FINDEはそんな動機から始まっています。
            </p>
          </div>
        </section>

        {/* ── 02 特に実現したかったこと ─────────────────────── */}
        <section className="py-14">
          <SectionHeading num="02" title="特に実現したかったこと" />
          <div className="space-y-5 text-sm leading-[1.95] text-foreground/70">
            <p>
              古着屋やセレクトショップを探す方法はいくつかあります。エリアで探す、雰囲気で探す、知人の口コミで探す——でも、ひとつだけどこにも存在しない探し方がありました。
            </p>
          </div>

          {/* Pull quote */}
          <blockquote className="my-10 border-l-2 border-primary pl-6">
            <p className="font-headline text-2xl font-black leading-snug tracking-tight text-foreground md:text-3xl">
              「このブランドを扱っているお店を探したい」
            </p>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/50">
              古着屋やセレクトショップの個性は、扱っているブランドに宿っています。それなのに、ブランド起点でお店を探す手段がどこにもありませんでした。FINDEで最初に実現したかったのは、まさにこの一点です。
            </p>
          </blockquote>

          <div className="space-y-5 text-sm leading-[1.95] text-foreground/70">
            <p>
              好きなブランドの服を扱っているお店が、自分の街や旅先にあるかもしれない。でも今まで、それを確かめる方法がありませんでした。FINDEはその「知りたかったこと」に、ひとつの答えを出そうとしています。
            </p>
          </div>
        </section>

        {/* ── 03 目指すこと ────────────────────────────────── */}
        <section className="py-14">
          <SectionHeading num="03" title="目指すこと" />

          {/* Statement */}
          <p className="mb-10 font-headline text-2xl font-black leading-snug tracking-tight text-foreground md:text-3xl">
            日本中の古着屋・セレクトショップを、<br className="hidden sm:block" />
            誰もが発見できる場所にすること。
          </p>

          <div className="space-y-5 text-sm leading-[1.95] text-foreground/70">
            <p>
              初めて訪れる街でも、自分の感性に合う一軒に出会えるように。お気に入りのブランドを扱うショップを、すぐに見つけられるように。そして、小さくても素晴らしいお店が、もっと多くの人に知ってもらえるように。
            </p>
            <p>
              検索する人とお店の間にある「見えない距離」を、FINDEで縮めていきたいと思っています。
            </p>
          </div>
        </section>

        {/* ── 04 これから ──────────────────────────────────── */}
        <section className="py-14">
          <SectionHeading num="04" title="これから" />
          <div className="space-y-5 text-sm leading-[1.95] text-foreground/70">
            <p>
              まだ、旅の途中です。現在は全国の店舗情報とブランドデータの拡充を進めています。「ウィッシュ」機能を通じてユーザーの欲しいものとお店をつなげる仕組みや、エリアごとの特集など、発見の楽しさをさらに広げる機能も考えています。
            </p>
            <p>
              完成形を目指すより、使ってくれる人たちと一緒に育てていきたい——そう思っています。気になることや要望があれば、ぜひお気軽にお知らせください。
            </p>
          </div>

          <div className="mt-8">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 border border-border px-4 py-2 text-[11px] font-bold text-muted-foreground/60 transition-colors hover:border-primary/40 hover:text-primary"
            >
              メッセージを送る
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10m-4-4 4 4-4 4" />
              </svg>
            </a>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <div className="py-14">
          <p className="mb-6 font-headline text-sm font-black text-foreground">
            お気に入りのお店を探してみる
          </p>
          <Link
            to="/shops"
            className="group inline-flex items-center gap-3 bg-primary px-6 py-3.5 transition-opacity hover:opacity-80"
          >
            <span className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white">
              店舗を探す
            </span>
            <span className="font-headline text-[10px] font-black text-white/40 transition-colors group-hover:text-white/70">
              →
            </span>
          </Link>
        </div>

      </div>
    </div>

  </div>
)

export default AboutPage
