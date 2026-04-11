import { useState } from 'react'

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

interface PaginationResult<T> {
  page: number
  pageSize: PageSizeOption
  totalPages: number
  totalItems: number
  paginatedItems: T[]
  setPage: (page: number) => void
  setPageSize: (size: PageSizeOption) => void
  resetPage: () => void
}

export function usePagination<T>(
  items: T[],
  initialPageSize: PageSizeOption = 20,
): PaginationResult<T> {
  const [page, setPageState] = useState(1)
  const [pageSize, setPageSizeState] = useState<PageSizeOption>(initialPageSize)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const clampedPage = Math.min(page, totalPages)
  const start = (clampedPage - 1) * pageSize
  const paginatedItems = items.slice(start, start + pageSize)

  const setPage = (p: number) => setPageState(Math.max(1, Math.min(p, totalPages)))

  const setPageSize = (size: PageSizeOption) => {
    setPageSizeState(size)
    setPageState(1)
  }

  const resetPage = () => setPageState(1)

  return {
    page: clampedPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    setPage,
    setPageSize,
    resetPage,
  }
}
