const NG_SCORE_THRESHOLD = 10

export interface NgWord {
  word: string
  score: number
}

export const calcNgScore = (text: string, ngWords: NgWord[]): number => {
  return ngWords.reduce((total, ng) => {
    const regex = new RegExp(ng.word, 'gi')
    const matches = text.match(regex)
    return total + (matches ? matches.length * ng.score : 0)
  }, 0)
}

export const isFlagged = (score: number): boolean => score >= NG_SCORE_THRESHOLD
