// X（旧Twitter）共有テキストの組み立て。
// X のツイートは重み付き280。URL は t.co で23固定。CJK/全角かな等は1文字=2でカウント。

export const TWEET_MAX_WEIGHT = 280
export const URL_WEIGHT = 23
export const SHARE_HASHTAGS = '\n\n#シャレ活 #FINDE'

const CJK_RANGE =
  /[ᄀ-ᇿ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦　-〿぀-ゟ゠-ヿ㐀-䶿一-鿿]/

export const charWeight = (ch: string): number => (CJK_RANGE.test(ch) ? 2 : 1)

export const weightedLength = (text: string): number =>
  Array.from(text).reduce((sum, ch) => sum + charWeight(ch), 0)

/** 重み予算に収まるまで本文を切り詰める（超過時のみ末尾「…」）。 */
export const trimToWeight = (body: string, budget: number): string => {
  if (weightedLength(body) <= budget) return body
  const ellipsisWeight = 1 // '…'
  let used = 0
  let result = ''
  for (const ch of Array.from(body)) {
    const w = charWeight(ch)
    if (used + w > budget - ellipsisWeight) break
    result += ch
    used += w
  }
  return `${result}…`
}

/** 投稿本文と共有URLから、X Web Intent 用のツイート本文（本文＋ハッシュタグ）を作る。 */
export const buildShareTweetText = (body: string): string => {
  const budget = TWEET_MAX_WEIGHT - URL_WEIGHT - weightedLength(SHARE_HASHTAGS)
  return `${trimToWeight(body, budget)}${SHARE_HASHTAGS}`
}
