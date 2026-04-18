// ============================================================
// Primitive types
// ============================================================

export type UserRole = 'user' | 'shop_owner' | 'admin'
export type ShopStatus = 'public' | 'private' | 'pending'
export type ReviewStatus = 'published' | 'flagged' | 'hidden'
export type WishType = 'brand' | 'item' | 'condition'
export type WishUrgency = 'low' | 'medium' | 'high'
export type WishCondition = 'new' | 'used'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type ReportReason = 'false_info' | 'harassment' | 'irrelevant' | 'other'
export type CategoryCode = 'mens' | 'ladies' | 'kids' | 'unisex' | 'vintage'
export type ListingRequestStatus = 'pending' | 'approved' | 'rejected'
export type StaffRole = 'owner' | 'staff'

// ============================================================
// Master entities
// ============================================================

export interface User {
  id: string
  role: UserRole
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Area {
  id: number
  prefecture: string
  city: string
  slug: string
}

export interface Prefecture {
  id: number
  name: string
  nameEn: string
  region: string
  slug: string
}

export interface City {
  id: number
  prefectureId: number
  name: string
}

export interface PriceRange {
  id: number
  label: string
  minPrice: number | null
  maxPrice: number | null
}

export interface Category {
  id: number
  code: CategoryCode
  name: string
}

export interface Tag {
  id: number
  name: string
  slug: string
}

// ============================================================
// Shop
// ============================================================

export interface BusinessHours {
  mon: DayHours | null
  tue: DayHours | null
  wed: DayHours | null
  thu: DayHours | null
  fri: DayHours | null
  sat: DayHours | null
  sun: DayHours | null
}

export interface DayHours {
  open: string  // "10:00"
  close: string // "20:00"
}

export interface ShopPhoto {
  id: string
  shopId: string
  storagePath: string
  order: number
  createdAt: string
}

export interface Shop {
  id: string
  name: string
  namePending: string | null
  description: string | null
  prefectureId: number | null
  cityId: number | null
  address: string | null
  area: Area | null
  priceRange: PriceRange | null
  phone: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  tiktokUrl: string | null
  businessHours: BusinessHours | null
  closedDays: string[]
  status: ShopStatus
  categories: Category[]
  tags: Tag[]
  brands: Brand[]
  photos: ShopPhoto[]
  reviewCount: number
  averageRating: number | null
  favoriteCount: number
  createdAt: string
  updatedAt: string
}

export interface ShopFilters {
  prefectureId?: number
  cityId?: number
  categoryId?: number
  priceRangeId?: number
  tagIds?: number[]
  brandId?: string
  brandName?: string
  query?: string
  sort?: 'popular' | 'newest' | 'rating'
}

// ============================================================
// Brand
// ============================================================

export interface Brand {
  id: string
  name: string
  nameKana: string | null
  aliases: string[]
  status: 'active' | 'merged'
  mergedInto: string | null
  submittedBy: string | null
  createdAt: string
}

// ============================================================
// Review
// ============================================================

export interface ReviewPhoto {
  id: string
  reviewId: string
  storagePath: string
  createdAt: string
}

export interface Review {
  id: string
  shopId: string
  userId: string
  user: Pick<User, 'id' | 'displayName' | 'avatarUrl'>
  body: string
  rating: number
  status: ReviewStatus
  ngScore: number
  photos: ReviewPhoto[]
  createdAt: string
  updatedAt: string
}

// ============================================================
// Wish
// ============================================================

export interface Wish {
  id: string
  userId: string
  type: WishType
  category: Category
  priceRange: PriceRange
  area: Area
  size: string | null
  tags: string[]
  condition: WishCondition | null
  urgency: WishUrgency | null
  note: string | null
  isPublic: boolean
  notifyEmail: boolean
  createdAt: string
  updatedAt: string
}

export interface WishFormValues {
  type: WishType
  categoryId: number
  priceRangeId: number
  areaId: number
  size?: string
  tags?: string[]
  condition?: WishCondition
  urgency?: WishUrgency
  note?: string
  isPublic: boolean
  notifyEmail: boolean
}

export interface ShopRecommend {
  shop: Shop
  matchedConditions: string[]
}

// ============================================================
// Subscription
// ============================================================

export interface Subscription {
  id: string
  shopId: string | null
  userId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}

// ============================================================
// Listing request / Owner application
// ============================================================

export interface ShopListingRequest {
  id: string
  submittedBy: string
  shopName: string
  description: string | null
  prefectureId: number | null
  cityId: number | null
  address: string | null
  priceRangeId: number | null
  categoryIds: number[]
  phone: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  tiktokUrl: string | null
  businessHours: BusinessHours | null
  note: string | null
  isOwnerRequest: boolean
  status: ListingRequestStatus
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface OwnerApplication {
  id: string
  userId: string
  shopId: string
  listingRequestId: string | null
  status: ListingRequestStatus
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
}

// ============================================================
// Notification
// ============================================================

export type NotificationType =
  | 'wish_match'
  | 'owner_application_result'
  | 'admin_new_listing'
  | 'admin_new_contact'
  | 'admin_review_report'
  | 'review_posted'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string | null
  linkUrl: string | null
  metadata: Record<string, string>
  isRead: boolean
  createdAt: string
}

// ============================================================
// Pagination
// ============================================================

export interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

export interface PaginatedResult<T> {
  items: T[]
  pageInfo: PageInfo
}
