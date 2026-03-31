import { create } from 'zustand'
import type { ShopFilters } from '@/types'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: 'default' | 'destructive'
}

interface UiState {
  // Toast
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Shop filters
  shopFilters: ShopFilters
  setShopFilters: (filters: ShopFilters) => void
  resetShopFilters: () => void

  // Modals
  reviewReportModalReviewId: string | null
  openReviewReportModal: (reviewId: string) => void
  closeReviewReportModal: () => void

  // Logout modal
  logoutModalOpen: boolean
  openLogoutModal: () => void
  closeLogoutModal: () => void
}

const DEFAULT_FILTERS: ShopFilters = {
  sort: 'popular',
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  shopFilters: DEFAULT_FILTERS,
  setShopFilters: (filters) => set({ shopFilters: filters }),
  resetShopFilters: () => set({ shopFilters: DEFAULT_FILTERS }),

  reviewReportModalReviewId: null,
  openReviewReportModal: (reviewId) => set({ reviewReportModalReviewId: reviewId }),
  closeReviewReportModal: () => set({ reviewReportModalReviewId: null }),

  logoutModalOpen: false,
  openLogoutModal: () => set({ logoutModalOpen: true }),
  closeLogoutModal: () => set({ logoutModalOpen: false }),
}))
