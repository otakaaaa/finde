import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OWNER_FEATURE_ENABLED, WISH_FEATURE_ENABLED } from '@/config/features'

// Public pages
const TopPage = lazy(() => import('@/pages/top/TopPage'))
const ShopsPage = lazy(() => import('@/pages/shops/ShopsPage'))
const ShopDetailPage = lazy(() => import('@/pages/shops/ShopDetailPage'))
const ShopItemDetailPage = lazy(() => import('@/pages/shops/ShopItemDetailPage'))

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const CallbackPage = lazy(() => import('@/pages/auth/CallbackPage'))
const SetupProfilePage = lazy(() => import('@/pages/auth/SetupProfilePage'))
const LinkAccountPage = lazy(() => import('@/pages/auth/LinkAccountPage'))
const MfaChallengePage = lazy(() => import('@/pages/auth/MfaChallengePage'))
const AuthErrorPage = lazy(() => import('@/pages/auth/AuthErrorPage'))

// User pages (auth required)
const MyPage = lazy(() => import('@/pages/mypage/MyPage'))
const SecurityPage = lazy(() => import('@/pages/mypage/SecurityPage'))
const FavoritesPage = lazy(() => import('@/pages/mypage/FavoritesPage'))
const ContactsPage = lazy(() => import('@/pages/mypage/ContactsPage'))
const NotificationsPage = lazy(() => import('@/pages/mypage/NotificationsPage'))
const ProfileEditPage = lazy(() => import('@/pages/mypage/ProfileEditPage'))
const AccountPage = lazy(() => import('@/pages/mypage/AccountPage'))
const WishesPage = lazy(() => import('@/pages/wishes/WishesPage'))
const WishNewPage = lazy(() => import('@/pages/wishes/WishNewPage'))
const WishEditPage = lazy(() => import('@/pages/wishes/WishEditPage'))
const ListingRequestPage = lazy(() => import('@/pages/listing-request/ListingRequestPage'))

// Share (シャレ活)
const ShareTimelinePage = lazy(() => import('@/pages/share/ShareTimelinePage'))
const SharePostDetailPage = lazy(() => import('@/pages/share/SharePostDetailPage'))
const SharePostNewPage = lazy(() => import('@/pages/share/SharePostNewPage'))
const SharePostEditPage = lazy(() => import('@/pages/share/SharePostEditPage'))
const MySharesPage = lazy(() => import('@/pages/share/MySharesPage'))
const MyShareDraftsPage = lazy(() => import('@/pages/share/MyShareDraftsPage'))
const MyShareBookmarksPage = lazy(() => import('@/pages/share/MyShareBookmarksPage'))

// Brand pages
const BrandSearchPage = lazy(() => import('@/pages/brands/BrandSearchPage'))
const BrandDetailPage = lazy(() => import('@/pages/brands/BrandDetailPage'))

// Owner pages
const OwnerDashboardPage = lazy(() => import('@/pages/owner/OwnerDashboardPage'))
const OwnerShopEditPage = lazy(() => import('@/pages/owner/OwnerShopEditPage'))
const BrandsManagePage = lazy(() => import('@/pages/owner/BrandsManagePage'))
const ShopItemTypesPage = lazy(() => import('@/pages/owner/ShopItemTypesPage'))
const ShopItemNewPage = lazy(() => import('@/pages/owner/ShopItemNewPage'))
const ShopItemEditPage = lazy(() => import('@/pages/owner/ShopItemEditPage'))
const OwnerWishAnalyticsPage = lazy(() => import('@/pages/owner/OwnerWishAnalyticsPage'))
const OwnerShopAnalyticsPage = lazy(() => import('@/pages/owner/OwnerShopAnalyticsPage'))
const OwnerShopAnnouncementsPage = lazy(() => import('@/pages/owner/OwnerShopAnnouncementsPage'))

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminShopsPage = lazy(() => import('@/pages/admin/AdminShopsPage'))
const AdminShopNewPage = lazy(() => import('@/pages/admin/AdminShopNewPage'))
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'))
const AdminBrandsPage = lazy(() => import('@/pages/admin/AdminBrandsPage'))
const AdminApplicationsPage = lazy(() => import('@/pages/admin/AdminApplicationsPage'))
const AdminShopBulkPage = lazy(() => import('@/pages/admin/AdminShopBulkPage'))
const AdminShopEditPage = lazy(() => import('@/pages/admin/AdminShopEditPage'))
const AdminContactsPage = lazy(() => import('@/pages/admin/AdminContactsPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminNewsPage = lazy(() => import('@/pages/admin/AdminNewsPage'))
const AdminNewsNewPage = lazy(() => import('@/pages/admin/AdminNewsNewPage'))
const AdminNewsEditPage = lazy(() => import('@/pages/admin/AdminNewsEditPage'))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))
const AdminShareReportsPage = lazy(() => import('@/pages/admin/AdminShareReportsPage'))
const OwnerApplicationDMPage = lazy(() => import('@/pages/owner-application/OwnerApplicationDMPage'))
const OwnerApplicationNewPage = lazy(() => import('@/pages/owner-application/OwnerApplicationNewPage'))
const OwnerApplicationListPage = lazy(() => import('@/pages/owner-application/OwnerApplicationListPage'))

// Contact pages
const ContactPage = lazy(() => import('@/pages/contact/ContactPage'))

// Legal pages
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'))

// FAQ
const FaqPage = lazy(() => import('@/pages/faq/FaqPage'))

// News
const NewsPage = lazy(() => import('@/pages/news/NewsPage'))
const NewsDetailPage = lazy(() => import('@/pages/news/NewsDetailPage'))

// 404
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <TopPage /> },
      { path: 'shops', element: <ShopsPage /> },
      { path: 'shops/:id', element: <ShopDetailPage /> },
      { path: 'shops/:shopId/items/:itemId', element: <ShopItemDetailPage /> },
      { path: 'brands', element: <BrandSearchPage /> },
      { path: 'brands/:id', element: <BrandDetailPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPolicyPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'news/:id', element: <NewsDetailPage /> },

      // Share (シャレ活) — 閲覧は公開
      { path: 'share', element: <ShareTimelinePage /> },
      { path: 'share/new', element: <ProtectedRoute><SharePostNewPage /></ProtectedRoute> },
      { path: 'share/:id', element: <SharePostDetailPage /> },
      { path: 'share/:id/edit', element: <ProtectedRoute><SharePostEditPage /></ProtectedRoute> },

      // Auth
      { path: 'auth/login', element: <LoginPage /> },
      { path: 'auth/register', element: <RegisterPage /> },
      { path: 'auth/callback', element: <CallbackPage /> },
      { path: 'auth/setup-profile', element: <ProtectedRoute><SetupProfilePage /></ProtectedRoute> },
      { path: 'auth/link-account', element: <LinkAccountPage /> },
      { path: 'auth/mfa', element: <MfaChallengePage /> },
      { path: 'auth/error', element: <AuthErrorPage /> },

      // User (auth required)
      { path: 'mypage', element: <ProtectedRoute><MyPage /></ProtectedRoute> },
      { path: 'mypage/security', element: <ProtectedRoute><SecurityPage /></ProtectedRoute> },
      { path: 'mypage/favorites', element: <ProtectedRoute><FavoritesPage /></ProtectedRoute> },
      { path: 'mypage/contacts', element: <ProtectedRoute><ContactsPage /></ProtectedRoute> },
      { path: 'mypage/notifications', element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
      { path: 'mypage/profile/edit', element: <ProtectedRoute><ProfileEditPage /></ProtectedRoute> },
      { path: 'mypage/account', element: <ProtectedRoute><AccountPage /></ProtectedRoute> },

      // Share management (本人限定)
      { path: 'mypage/share', element: <ProtectedRoute><MySharesPage /></ProtectedRoute> },
      { path: 'mypage/share/drafts', element: <ProtectedRoute><MyShareDraftsPage /></ProtectedRoute> },
      { path: 'mypage/share/bookmarks', element: <ProtectedRoute><MyShareBookmarksPage /></ProtectedRoute> },

      // Wishes
      { path: 'wishes', element: WISH_FEATURE_ENABLED ? <ProtectedRoute><WishesPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'wishes/new', element: WISH_FEATURE_ENABLED ? <ProtectedRoute><WishNewPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'wishes/:id/edit', element: WISH_FEATURE_ENABLED ? <ProtectedRoute><WishEditPage /></ProtectedRoute> : <Navigate to="/" replace /> },

      { path: 'listing-request', element: <ProtectedRoute><ListingRequestPage /></ProtectedRoute> },
      { path: 'owner-application', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute><OwnerApplicationListPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner-application/new', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute><OwnerApplicationNewPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner-application/:requestId', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute><OwnerApplicationDMPage /></ProtectedRoute> : <Navigate to="/" replace /> },

      // Owner
      { path: 'owner', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><OwnerDashboardPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner/shops/:id/edit', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><OwnerShopEditPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner/shops/:id/brands', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><BrandsManagePage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner/shops/:shopId/items', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><ShopItemTypesPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner/shops/:shopId/items/new', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><ShopItemNewPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner/shops/:shopId/items/:itemId/edit', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><ShopItemEditPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner/shops/:shopId/wish-analytics', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><OwnerWishAnalyticsPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner/shops/:shopId/analytics', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><OwnerShopAnalyticsPage /></ProtectedRoute> : <Navigate to="/" replace /> },
      { path: 'owner/shops/:shopId/announcements', element: OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><OwnerShopAnnouncementsPage /></ProtectedRoute> : <Navigate to="/" replace /> },

      // Admin
      { path: 'admin', element: <ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute> },
      { path: 'admin/shops', element: <ProtectedRoute requiredRole="admin"><AdminShopsPage /></ProtectedRoute> },
      { path: 'admin/shops/new', element: <ProtectedRoute requiredRole="admin"><AdminShopNewPage /></ProtectedRoute> },
      { path: 'admin/shops/bulk', element: <ProtectedRoute requiredRole="admin"><AdminShopBulkPage /></ProtectedRoute> },
      { path: 'admin/shops/:id/edit', element: <ProtectedRoute requiredRole="admin"><AdminShopEditPage /></ProtectedRoute> },
      { path: 'admin/shops/:id/brands', element: <ProtectedRoute requiredRole="admin"><BrandsManagePage /></ProtectedRoute> },
      { path: 'admin/reviews', element: <ProtectedRoute requiredRole="admin"><AdminReviewsPage /></ProtectedRoute> },
      { path: 'admin/brands', element: <ProtectedRoute requiredRole="admin"><AdminBrandsPage /></ProtectedRoute> },
      { path: 'admin/applications', element: <ProtectedRoute requiredRole="admin"><AdminApplicationsPage /></ProtectedRoute> },
      { path: 'admin/contacts', element: <ProtectedRoute requiredRole="admin"><AdminContactsPage /></ProtectedRoute> },
      { path: 'admin/users', element: <ProtectedRoute requiredRole="admin"><AdminUsersPage /></ProtectedRoute> },
      { path: 'admin/news', element: <ProtectedRoute requiredRole="admin"><AdminNewsPage /></ProtectedRoute> },
      { path: 'admin/news/new', element: <ProtectedRoute requiredRole="admin"><AdminNewsNewPage /></ProtectedRoute> },
      { path: 'admin/news/:id/edit', element: <ProtectedRoute requiredRole="admin"><AdminNewsEditPage /></ProtectedRoute> },
      { path: 'admin/analytics', element: <ProtectedRoute requiredRole="admin"><AdminAnalyticsPage /></ProtectedRoute> },
      { path: 'admin/share-reports', element: <ProtectedRoute requiredRole="admin"><AdminShareReportsPage /></ProtectedRoute> },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  </ErrorBoundary>
)

export default App
