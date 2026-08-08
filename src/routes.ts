import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

/**
 * ルート定義（旧 src/App.tsx の createBrowserRouter を移行）。
 * - 公開ページ: pages/ 配下のファイルを直接ルートモジュールとして使用
 * - 動的公開ページ（SEOメタが必要）: routes/ 配下のラッパー（loader + meta 付き）
 * - 認証/ロール必須ページ: routes/require-*.tsx のレイアウトルートで保護
 */
export default [
  index('pages/top/TopPage.tsx'),
  route('shops', 'pages/shops/ShopsPage.tsx'),
  route('shops/:id', 'routes/shop-detail.tsx'),
  route('shops/:shopId/items/:itemId', 'pages/shops/ShopItemDetailPage.tsx'),
  route('brands', 'pages/brands/BrandSearchPage.tsx'),
  route('brands/:id', 'routes/brand-detail.tsx'),
  route('contact', 'pages/contact/ContactPage.tsx'),
  route('terms', 'pages/legal/TermsPage.tsx'),
  route('privacy', 'pages/legal/PrivacyPolicyPage.tsx'),
  route('faq', 'pages/faq/FaqPage.tsx'),
  route('news', 'pages/news/NewsPage.tsx'),
  route('news/:id', 'routes/news-detail.tsx'),

  // Share（シャレ活）— 閲覧は公開
  route('share', 'pages/share/ShareTimelinePage.tsx'),
  route('share/:id', 'routes/share-post-detail.tsx'),

  // Auth（公開）
  route('auth/login', 'pages/auth/LoginPage.tsx'),
  route('auth/register', 'pages/auth/RegisterPage.tsx'),
  route('auth/callback', 'pages/auth/CallbackPage.tsx'),
  route('auth/link-account', 'pages/auth/LinkAccountPage.tsx'),
  route('auth/mfa', 'pages/auth/MfaChallengePage.tsx'),
  route('auth/error', 'pages/auth/AuthErrorPage.tsx'),

  // 認証必須
  layout('routes/require-auth.tsx', [
    route('auth/setup-profile', 'pages/auth/SetupProfilePage.tsx'),
    route('share/new', 'pages/share/SharePostNewPage.tsx'),
    route('share/:id/edit', 'pages/share/SharePostEditPage.tsx'),
    route('mypage', 'pages/mypage/MyPage.tsx'),
    route('mypage/security', 'pages/mypage/SecurityPage.tsx'),
    route('mypage/follows', 'pages/mypage/FollowedShopsPage.tsx'),
    // 旧URL互換（お気に入り → フォローへの改名）
    route('mypage/favorites', 'routes/mypage-favorites-redirect.tsx'),
    route('mypage/contacts', 'pages/mypage/ContactsPage.tsx'),
    route('mypage/notifications', 'pages/mypage/NotificationsPage.tsx'),
    route('mypage/profile/edit', 'pages/mypage/ProfileEditPage.tsx'),
    route('mypage/account', 'pages/mypage/AccountPage.tsx'),
    route('mypage/share', 'pages/share/MySharesPage.tsx'),
    route('mypage/share/drafts', 'pages/share/MyShareDraftsPage.tsx'),
    route('mypage/share/bookmarks', 'pages/share/MyShareBookmarksPage.tsx'),
    route('listing-request', 'pages/listing-request/ListingRequestPage.tsx'),
  ]),

  // ウィッシュ（機能フラグ + 認証必須）
  layout('routes/require-wish.tsx', [
    route('wishes', 'pages/wishes/WishesPage.tsx'),
    route('wishes/new', 'pages/wishes/WishNewPage.tsx'),
    route('wishes/:id/edit', 'pages/wishes/WishEditPage.tsx'),
  ]),

  // オーナー申請（機能フラグ + 認証必須）
  layout('routes/require-owner-feature.tsx', [
    route('owner-application', 'pages/owner-application/OwnerApplicationListPage.tsx'),
    route('owner-application/new', 'pages/owner-application/OwnerApplicationNewPage.tsx'),
    route('owner-application/:requestId', 'pages/owner-application/OwnerApplicationDMPage.tsx'),
  ]),

  // オーナー（機能フラグ + shop_owner ロール必須）
  layout('routes/require-owner.tsx', [
    route('owner', 'pages/owner/OwnerDashboardPage.tsx'),
    route('owner/shops/:id/edit', 'pages/owner/OwnerShopEditPage.tsx'),
    route('owner/shops/:id/brands', 'routes/owner-shop-brands.tsx'),
    route('owner/shops/:shopId/items', 'pages/owner/ShopItemTypesPage.tsx'),
    route('owner/shops/:shopId/items/new', 'pages/owner/ShopItemNewPage.tsx'),
    route('owner/shops/:shopId/items/:itemId/edit', 'pages/owner/ShopItemEditPage.tsx'),
    route('owner/shops/:shopId/wish-analytics', 'pages/owner/OwnerWishAnalyticsPage.tsx'),
    route('owner/shops/:shopId/analytics', 'pages/owner/OwnerShopAnalyticsPage.tsx'),
    route('owner/shops/:shopId/announcements', 'pages/owner/OwnerShopAnnouncementsPage.tsx'),
  ]),

  // 管理者
  layout('routes/require-admin.tsx', [
    route('admin', 'pages/admin/AdminDashboardPage.tsx'),
    route('admin/shops', 'pages/admin/AdminShopsPage.tsx'),
    route('admin/shops/new', 'pages/admin/AdminShopNewPage.tsx'),
    route('admin/shops/bulk', 'pages/admin/AdminShopBulkPage.tsx'),
    route('admin/shops/:id/edit', 'pages/admin/AdminShopEditPage.tsx'),
    route('admin/shops/:id/brands', 'routes/admin-shop-brands.tsx'),
    route('admin/brands', 'pages/admin/AdminBrandsPage.tsx'),
    route('admin/applications', 'pages/admin/AdminApplicationsPage.tsx'),
    route('admin/contacts', 'pages/admin/AdminContactsPage.tsx'),
    route('admin/users', 'pages/admin/AdminUsersPage.tsx'),
    route('admin/news', 'pages/admin/AdminNewsPage.tsx'),
    route('admin/news/new', 'pages/admin/AdminNewsNewPage.tsx'),
    route('admin/news/:id/edit', 'pages/admin/AdminNewsEditPage.tsx'),
    route('admin/analytics', 'pages/admin/AdminAnalyticsPage.tsx'),
    route('admin/share-reports', 'pages/admin/AdminShareReportsPage.tsx'),
  ]),

  // リソースルート（XMLを動的生成）
  route('sitemap.xml', 'routes/sitemap.ts'),

  // 404（404ステータスを返すためラッパー経由）
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
