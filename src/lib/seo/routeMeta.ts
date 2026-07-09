import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { resolvePageMeta } from './resolve'
import { getSupabaseConfig } from './config'
import { pageMetaToDescriptors } from './descriptors'
import type { PageMeta } from './meta'

export interface SeoLoaderData {
  pageMeta: PageMeta
}

/**
 * 動的公開ページ（店舗・ブランド・お知らせ・シャレ活）共通のSEOローダー。
 * サーバーでSupabaseからメタ情報を解決し、初期HTMLの <head> に反映する。
 * （旧 functions/_middleware.ts の置き換え）
 */
export const seoLoader = async ({ request }: LoaderFunctionArgs): Promise<SeoLoaderData> => {
  const pathname = new URL(request.url).pathname
  const pageMeta = await resolvePageMeta(pathname, getSupabaseConfig())
  return { pageMeta }
}

export const seoMeta: MetaFunction<typeof seoLoader> = ({ data }) =>
  data?.pageMeta ? pageMetaToDescriptors(data.pageMeta) : []
