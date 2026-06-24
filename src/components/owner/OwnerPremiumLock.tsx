import { Link } from 'react-router'
import { ChevronLeft, Lock, Check } from 'lucide-react'
import {
  OWNER_PREMIUM_FEATURES,
  OWNER_PREMIUM_PLAN_NAME,
  type OwnerPremiumFeature,
} from '@/config/ownerPremium'

interface OwnerPremiumLockProps {
  /** 表示対象の有料機能 */
  feature: OwnerPremiumFeature
}

/**
 * 無料オーナーが有料機能にアクセスした際に表示するロック画面。
 *
 * 課金導線（決済）は準備中のため、登録ボタンは設置せず
 * 「有料プランの機能であること」と「準備中であること」のみを伝える。
 */
export const OwnerPremiumLock = ({ feature }: OwnerPremiumLockProps) => {
  const meta = OWNER_PREMIUM_FEATURES[feature]
  const allFeatures = Object.values(OWNER_PREMIUM_FEATURES)

  return (
    <div className="min-h-[calc(100dvh-56px)]">

      {/* ── Page header ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            PRO
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to="/owner"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボードへ
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— {OWNER_PREMIUM_PLAN_NAME}</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              {meta.label}
            </h1>
          </div>
        </div>
      </section>

      {/* ── Lock body ───────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-16 md:py-16">
          <div className="flex flex-col items-center border border-border bg-white px-6 py-12 text-center editorial-shadow">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary/60">
              <Lock className="h-6 w-6" />
            </div>

            <p className="mt-6 font-headline text-[10px] font-black uppercase tracking-[0.4em] text-primary/50">
              Premium Feature
            </p>
            <h2 className="mt-2 font-headline text-xl font-black tracking-tight text-foreground">
              この機能は「{OWNER_PREMIUM_PLAN_NAME}」限定です
            </h2>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted-foreground/70">
              「{meta.label}」は有料プラン「{OWNER_PREMIUM_PLAN_NAME}」でご利用いただける機能です。{meta.description}
            </p>

            {/* 準備中の案内 */}
            <div className="mt-6 w-full max-w-md border border-amber-200 bg-amber-50/60 px-4 py-3 text-left">
              <p className="text-[12px] leading-relaxed text-amber-800/90">
                有料プランは現在準備中です。お申し込み開始までいましばらくお待ちください。
                準備が整い次第、本サービス上でご案内いたします。
              </p>
            </div>

            {/* 有料機能一覧 */}
            <div className="mt-8 w-full max-w-md text-left">
              <p className="mb-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                {OWNER_PREMIUM_PLAN_NAME}で使える機能
              </p>
              <ul className="space-y-2">
                {allFeatures.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/50" />
                    <span className="text-[13px] text-foreground/80">
                      <span className="font-bold">{f.label}</span>
                      <span className="text-muted-foreground/60"> — {f.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/owner"
              className="mt-10 bg-primary px-6 py-2.5 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-90"
            >
              ダッシュボードへ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
