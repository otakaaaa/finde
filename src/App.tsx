import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Public pages
const TopPage = lazy(() => import('@/pages/top/TopPage'))
const ShopsPage = lazy(() => import('@/pages/shops/ShopsPage'))
const ShopDetailPage = lazy(() => import('@/pages/shops/ShopDetailPage'))
const SearchPage = lazy(() => import('@/pages/search/SearchPage'))

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const CallbackPage = lazy(() => import('@/pages/auth/CallbackPage'))
const LinkAccountPage = lazy(() => import('@/pages/auth/LinkAccountPage'))

// User pages (auth required)
const MyPage = lazy(() => import('@/pages/mypage/MyPage'))
const FavoritesPage = lazy(() => import('@/pages/mypage/FavoritesPage'))
const WishesPage = lazy(() => import('@/pages/wishes/WishesPage'))
const WishNewPage = lazy(() => import('@/pages/wishes/WishNewPage'))
const WishEditPage = lazy(() => import('@/pages/wishes/WishEditPage'))
const ListingRequestPage = lazy(() => import('@/pages/listing-request/ListingRequestPage'))

// Brand pages
const BrandSearchPage = lazy(() => import('@/pages/brands/BrandSearchPage'))

// Owner pages
const OwnerDashboardPage = lazy(() => import('@/pages/owner/OwnerDashboardPage'))
const ShopEditPage = lazy(() => import('@/pages/owner/ShopEditPage'))
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
const AdminEmailTemplatesPage = lazy(() => import('@/pages/admin/AdminEmailTemplatesPage'))

// Contact pages
const ContactPage = lazy(() => import('@/pages/contact/ContactPage'))

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
            <Route path="/search" element={<SearchPage />} />
            <Route path="/brands" element={<BrandSearchPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Auth */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<CallbackPage />} />
            <Route path="/auth/link-account" element={<LinkAccountPage />} />

            {/* User (auth required) */}
            <Route
              path="/mypage"
              element={<ProtectedRoute><MyPage /></ProtectedRoute>}
            />
            <Route
              path="/mypage/favorites"
              element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>}
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

            {/* Owner */}
            <Route
              path="/owner/dashboard"
              element={<ProtectedRoute requiredRole="shop_owner"><OwnerDashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/owner/shops/:id"
              element={<ProtectedRoute requiredRole="shop_owner"><ShopEditPage /></ProtectedRoute>}
            />
            <Route
              path="/owner/shops/:id/brands"
              element={<ProtectedRoute requiredRole="shop_owner"><BrandsManagePage /></ProtectedRoute>}
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
            <Route
              path="/admin/email-templates"
              element={<ProtectedRoute requiredRole="admin"><AdminEmailTemplatesPage /></ProtectedRoute>}
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </QueryClientProvider>
)

export default App
