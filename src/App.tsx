import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { OWNER_FEATURE_ENABLED } from '@/config/features'

// Public pages
const TopPage = lazy(() => import('@/pages/top/TopPage'))
const ShopsPage = lazy(() => import('@/pages/shops/ShopsPage'))
const ShopDetailPage = lazy(() => import('@/pages/shops/ShopDetailPage'))

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const CallbackPage = lazy(() => import('@/pages/auth/CallbackPage'))
const LinkAccountPage = lazy(() => import('@/pages/auth/LinkAccountPage'))
const MfaChallengePage = lazy(() => import('@/pages/auth/MfaChallengePage'))

// User pages (auth required)
const MyPage = lazy(() => import('@/pages/mypage/MyPage'))
const SecurityPage = lazy(() => import('@/pages/mypage/SecurityPage'))
const FavoritesPage = lazy(() => import('@/pages/mypage/FavoritesPage'))
const ContactsPage = lazy(() => import('@/pages/mypage/ContactsPage'))
const NotificationsPage = lazy(() => import('@/pages/mypage/NotificationsPage'))
const WishesPage = lazy(() => import('@/pages/wishes/WishesPage'))
const WishNewPage = lazy(() => import('@/pages/wishes/WishNewPage'))
const WishEditPage = lazy(() => import('@/pages/wishes/WishEditPage'))
const ListingRequestPage = lazy(() => import('@/pages/listing-request/ListingRequestPage'))
const SubscriptionPage = lazy(() => import('@/pages/mypage/SubscriptionPage'))

// Brand pages
const BrandSearchPage = lazy(() => import('@/pages/brands/BrandSearchPage'))

// Owner pages
const OwnerDashboardPage = lazy(() => import('@/pages/owner/OwnerDashboardPage'))
const OwnerShopEditPage = lazy(() => import('@/pages/owner/OwnerShopEditPage'))
const BrandsManagePage = lazy(() => import('@/pages/owner/BrandsManagePage'))

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminShopsPage = lazy(() => import('@/pages/admin/AdminShopsPage'))
const AdminShopNewPage = lazy(() => import('@/pages/admin/AdminShopNewPage'))
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'))
const AdminBrandsPage = lazy(() => import('@/pages/admin/AdminBrandsPage'))
const AdminApplicationsPage = lazy(() => import('@/pages/admin/AdminApplicationsPage'))
const AdminSubscriptionsPage = lazy(() => import('@/pages/admin/AdminSubscriptionsPage'))
const AdminShopBulkPage = lazy(() => import('@/pages/admin/AdminShopBulkPage'))
const AdminShopEditPage = lazy(() => import('@/pages/admin/AdminShopEditPage'))
const AdminContactsPage = lazy(() => import('@/pages/admin/AdminContactsPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const OwnerApplicationDMPage = lazy(() => import('@/pages/owner-application/OwnerApplicationDMPage'))
const OwnerApplicationNewPage = lazy(() => import('@/pages/owner-application/OwnerApplicationNewPage'))

// Contact pages
const ContactPage = lazy(() => import('@/pages/contact/ContactPage'))

// Legal pages
const TermsPage = lazy(() => import('@/pages/legal/TermsPage'))
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'))

// FAQ
const FaqPage = lazy(() => import('@/pages/faq/FaqPage'))

// About
const AboutPage = lazy(() => import('@/pages/about/AboutPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      retry: 1,
    },
  },
})

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Layout wrapper */}
          <Route element={<Layout />}>
            <Route path="/" element={<TopPage />} />
            <Route path="/shops" element={<ShopsPage />} />
            <Route path="/shops/:id" element={<ShopDetailPage />} />
            <Route path="/brands" element={<BrandSearchPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Auth */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<CallbackPage />} />
            <Route path="/auth/link-account" element={<LinkAccountPage />} />
            <Route path="/auth/mfa" element={<MfaChallengePage />} />

            {/* User (auth required) */}
            <Route
              path="/mypage"
              element={<ProtectedRoute><MyPage /></ProtectedRoute>}
            />
            <Route
              path="/mypage/security"
              element={<ProtectedRoute><SecurityPage /></ProtectedRoute>}
            />
            <Route
              path="/mypage/favorites"
              element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>}
            />
            <Route
              path="/mypage/contacts"
              element={<ProtectedRoute><ContactsPage /></ProtectedRoute>}
            />
            <Route
              path="/mypage/notifications"
              element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
            />
            <Route
              path="/wishes"
              element={<ProtectedRoute><WishesPage /></ProtectedRoute>}
            />
            <Route
              path="/wishes/new"
              element={<ProtectedRoute><WishNewPage /></ProtectedRoute>}
            />
            <Route
              path="/wishes/:id/edit"
              element={<ProtectedRoute><WishEditPage /></ProtectedRoute>}
            />
            <Route
              path="/listing-request"
              element={<ProtectedRoute><ListingRequestPage /></ProtectedRoute>}
            />
            <Route
              path="/mypage/subscription"
              element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>}
            />
            <Route
              path="/owner-application/new"
              element={OWNER_FEATURE_ENABLED ? <ProtectedRoute><OwnerApplicationNewPage /></ProtectedRoute> : <Navigate to="/" replace />}
            />
            <Route
              path="/owner-application/:requestId"
              element={OWNER_FEATURE_ENABLED ? <ProtectedRoute><OwnerApplicationDMPage /></ProtectedRoute> : <Navigate to="/" replace />}
            />

            {/* Owner */}
            <Route
              path="/owner"
              element={OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><OwnerDashboardPage /></ProtectedRoute> : <Navigate to="/" replace />}
            />
            <Route
              path="/owner/shops/:id/edit"
              element={OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><OwnerShopEditPage /></ProtectedRoute> : <Navigate to="/" replace />}
            />
            <Route
              path="/owner/shops/:id/brands"
              element={OWNER_FEATURE_ENABLED ? <ProtectedRoute requiredRole="shop_owner"><BrandsManagePage /></ProtectedRoute> : <Navigate to="/" replace />}
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={<ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/shops"
              element={<ProtectedRoute requiredRole="admin"><AdminShopsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/shops/new"
              element={<ProtectedRoute requiredRole="admin"><AdminShopNewPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/shops/bulk"
              element={<ProtectedRoute requiredRole="admin"><AdminShopBulkPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/shops/:id/edit"
              element={<ProtectedRoute requiredRole="admin"><AdminShopEditPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/shops/:id/brands"
              element={<ProtectedRoute requiredRole="admin"><BrandsManagePage /></ProtectedRoute>}
            />
            <Route
              path="/admin/reviews"
              element={<ProtectedRoute requiredRole="admin"><AdminReviewsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/brands"
              element={<ProtectedRoute requiredRole="admin"><AdminBrandsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/applications"
              element={<ProtectedRoute requiredRole="admin"><AdminApplicationsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/subscriptions"
              element={<ProtectedRoute requiredRole="admin"><AdminSubscriptionsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/contacts"
              element={<ProtectedRoute requiredRole="admin"><AdminContactsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/users"
              element={<ProtectedRoute requiredRole="admin"><AdminUsersPage /></ProtectedRoute>}
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
)

export default App
