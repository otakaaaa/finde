import { create } from 'zustand'
import type { ShopFilters } from '@/types'

export type ToastPosition = 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: 'default' | 'destructive'
  position: ToastPosition
}

export type ToastInput = Omit<Toast, 'id' | 'position'> & { position?: ToastPosition }

interface UiState {
  // Toast
  toasts: Toast[]
  addToast: (toast: ToastInput) => void
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

  // Delete account modal
  deleteAccountModalOpen: boolean
  openDeleteAccountModal: () => void
  closeDeleteAccountModal: () => void
}

const DEFAULT_FILTERS: ShopFilters = {
  sort: 'popular',
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: crypto.randomUUID(), position: toast.position ?? 'top-center' },
      ],
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

  deleteAccountModalOpen: false,
  openDeleteAccountModal: () => set({ deleteAccountModalOpen: true }),
  closeDeleteAccountModal: () => set({ deleteAccountModalOpen: false }),
}))
