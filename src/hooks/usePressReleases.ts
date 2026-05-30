import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PressRelease } from '@/types'

// ── 内部型・マッパー ──────────────────────────────────────────

interface PressReleaseRow {
  id: string
  title: string
  body: string
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

const mapRow = (row: PressReleaseRow): PressRelease => ({
  id: row.id,
  title: row.title,
  body: row.body,
  publishedAt: row.published_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

type QueryResult<T> = Promise<{ data: T | null; error: { message: string } | null }>
type CountResult<T> = Promise<{ data: T | null; count: number | null; error: { message: string } | null }>

// ── 公開向けフック ────────────────────────────────────────────

export const useLatestPressReleases = () =>
  useQuery({
    queryKey: ['press-releases-latest'],
    queryFn: async () => {
      const { data, error } = await (
        supabase
          .from('press_releases')
          .select('id, title, published_at, created_at, updated_at, body, created_by')
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(3) as unknown as QueryResult<PressReleaseRow[]>
      )
      if (error) throw new Error(error.message)
      return (data ?? []).map(mapRow)
    },
    staleTime: 60 * 1000,
  })

export const usePressReleases = (page: number, pageSize: number) =>
  useQuery({
    queryKey: ['press-releases', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, count, error } = await (
        supabase
          .from('press_releases')
          .select('id, title, body, published_at, created_by, created_at, updated_at', { count: 'exact' })
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .range(from, to) as unknown as CountResult<PressReleaseRow[]>
      )
      if (error) throw new Error(error.message)
      return { items: (data ?? []).map(mapRow), totalCount: count ?? 0 }
    },
    staleTime: 60 * 1000,
  })

export const usePressRelease = (id: string) =>
  useQuery({
    queryKey: ['press-release', id],
    queryFn: async () => {
      const { data, error } = await (
        supabase
          .from('press_releases')
          .select('id, title, body, published_at, created_by, created_at, updated_at')
          .eq('id', id)
          .not('published_at', 'is', null)
          .lte('published_at', new Date().toISOString())
          .maybeSingle() as unknown as QueryResult<PressReleaseRow>
      )
      if (error) throw new Error(error.message)
      return data ? mapRow(data) : null
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })

// ── 管理向けフック ────────────────────────────────────────────

export const useAdminPressReleases = (page: number, pageSize: number, statusFilter: 'all' | 'published' | 'draft') =>
  useQuery({
    queryKey: ['admin-press-releases', page, pageSize, statusFilter],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let q = supabase
        .from('press_releases')
        .select('id, title, body, published_at, created_by, created_at, updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (statusFilter === 'published') q = q.not('published_at', 'is', null)
      if (statusFilter === 'draft')     q = q.is('published_at', null)

      const { data, count, error } = await (q as unknown as CountResult<PressReleaseRow[]>)
      if (error) throw new Error(error.message)
      return { items: (data ?? []).map(mapRow), totalCount: count ?? 0 }
    },
    staleTime: 30 * 1000,
  })

export const useAdminPressRelease = (id: string) =>
  useQuery({
    queryKey: ['admin-press-release', id],
    queryFn: async () => {
      const { data, error } = await (
        supabase
          .from('press_releases')
          .select('id, title, body, published_at, created_by, created_at, updated_at')
          .eq('id', id)
          .maybeSingle() as unknown as QueryResult<PressReleaseRow>
      )
      if (error) throw new Error(error.message)
      return data ? mapRow(data) : null
    },
    staleTime: 30 * 1000,
    enabled: !!id,
  })

// ── Mutation ──────────────────────────────────────────────────

interface CreateInput {
  title: string
  body: string
  publishedAt: string | null
}

interface UpdateInput {
  id: string
  title: string
  body: string
  publishedAt: string | null
}

export const useCreatePressRelease = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const { error } = await (
        supabase
          .from('press_releases')
          .insert({
            title: input.title,
            body: input.body,
            published_at: input.publishedAt,
          } as never) as unknown as { error: { message: string } | null }
      )
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-press-releases'] })
      queryClient.invalidateQueries({ queryKey: ['press-releases'] })
      queryClient.invalidateQueries({ queryKey: ['press-releases-latest'] })
    },
  })
}

export const useUpdatePressRelease = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateInput) => {
      const { error } = await (
        supabase
          .from('press_releases')
          .update({
            title: input.title,
            body: input.body,
            published_at: input.publishedAt,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', input.id) as unknown as { error: { message: string } | null }
      )
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['admin-press-releases'] })
      queryClient.invalidateQueries({ queryKey: ['admin-press-release', input.id] })
      queryClient.invalidateQueries({ queryKey: ['press-releases'] })
      queryClient.invalidateQueries({ queryKey: ['press-release', input.id] })
      queryClient.invalidateQueries({ queryKey: ['press-releases-latest'] })
    },
  })
}

export const useDeletePressRelease = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (
        supabase
          .from('press_releases')
          .delete()
          .eq('id', id) as unknown as { error: { message: string } | null }
      )
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-press-releases'] })
      queryClient.invalidateQueries({ queryKey: ['press-releases'] })
      queryClient.invalidateQueries({ queryKey: ['press-releases-latest'] })
    },
  })
}
