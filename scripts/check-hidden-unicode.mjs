#!/usr/bin/env node
// =============================================================
// 隠れ Unicode 検知（Trojan Source 対策 / CVE-2021-42574）
//
// 双方向制御文字・ゼロ幅文字などの「人間には見えないが実行に影響し得る」
// 文字がソースに混入していないか検査する。git 管理下のテキストファイルを
// 走査し、1つでも検出したら非ゼロ終了する（CI ゲート用）。
//
// 誤検知を避けるため、日本語や絵文字で正当に使われ得る文字（NBSP・
// ZWJ(U+200D)・異体字セレクタ等）は対象に含めず、コード中でまず正当に
// 使われない高シグナルな制御文字のみを対象とする。
//
// 実装ノート: 危険文字そのものをソースに埋め込むと自己検出でフラグが立つため、
// コードポイントは必ず数値（0x....）で定義し、リテラル文字を書かないこと。
// =============================================================
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// コードポイント → 名称。リテラル文字は書かない（自己検出防止）。
export const HIDDEN_CODEPOINTS = new Map([
  // 双方向オーバーライド／埋め込み／隔離（Trojan Source の主経路）
  [0x202a, 'LEFT-TO-RIGHT EMBEDDING'],
  [0x202b, 'RIGHT-TO-LEFT EMBEDDING'],
  [0x202c, 'POP DIRECTIONAL FORMATTING'],
  [0x202d, 'LEFT-TO-RIGHT OVERRIDE'],
  [0x202e, 'RIGHT-TO-LEFT OVERRIDE'],
  [0x2066, 'LEFT-TO-RIGHT ISOLATE'],
  [0x2067, 'RIGHT-TO-LEFT ISOLATE'],
  [0x2068, 'FIRST STRONG ISOLATE'],
  [0x2069, 'POP DIRECTIONAL ISOLATE'],
  // 双方向マーク
  [0x200e, 'LEFT-TO-RIGHT MARK'],
  [0x200f, 'RIGHT-TO-LEFT MARK'],
  [0x061c, 'ARABIC LETTER MARK'],
  // ゼロ幅・不可視
  [0x200b, 'ZERO WIDTH SPACE'],
  [0x2060, 'WORD JOINER'],
  [0x00ad, 'SOFT HYPHEN'],
  // 行区切り（JS パーサに影響し得る）
  [0x2028, 'LINE SEPARATOR'],
  [0x2029, 'PARAGRAPH SEPARATOR'],
  // U+FEFF は先頭 BOM のみ許容し、それ以外は下の findHiddenChars で個別判定
  [0xfeff, 'ZERO WIDTH NO-BREAK SPACE (BOM)'],
])

// 走査対象とするテキスト系拡張子（バイナリは除外して誤読を防ぐ）
const TEXT_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'css', 'scss',
  'html', 'md', 'mdx', 'sql', 'yml', 'yaml', 'toml', 'txt', 'svg', 'xml',
])

/**
 * テキスト内の隠れ Unicode を検出する（純粋関数・テスト対象）。
 * @param {string} text
 * @returns {{ index: number, line: number, column: number, codePoint: number, name: string }[]}
 */
export function findHiddenChars(text) {
  const findings = []
  let line = 1
  let column = 1

  for (let i = 0; i < text.length; i++) {
    const codePoint = text.codePointAt(i)

    const name = HIDDEN_CODEPOINTS.get(codePoint)
    if (name !== undefined) {
      // 先頭の BOM（U+FEFF が index 0）はエディタが付与し得るため許容する
      const isLeadingBom = codePoint === 0xfeff && i === 0
      if (!isLeadingBom) {
        findings.push({ index: i, line, column, codePoint, name })
      }
    }

    if (codePoint === 0x0a) {
      line++
      column = 1
    } else {
      column++
    }
  }

  return findings
}

function hasTextExtension(file) {
  const dot = file.lastIndexOf('.')
  if (dot === -1) return false
  return TEXT_EXTENSIONS.has(file.slice(dot + 1).toLowerCase())
}

function listTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return out.split('\n').map((f) => f.trim()).filter(Boolean)
}

function toHex(codePoint) {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
}

function main() {
  const files = listTrackedFiles().filter(hasTextExtension)
  let total = 0

  for (const file of files) {
    let text
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    const findings = findHiddenChars(text)
    for (const f of findings) {
      total++
      console.error(`${file}:${f.line}:${f.column}  ${toHex(f.codePoint)} ${f.name}`)
    }
  }

  if (total > 0) {
    console.error(`\n✖ 隠れ Unicode を ${total} 件検出しました。上記箇所を確認してください。`)
    process.exit(1)
  }

  console.log(`✓ 隠れ Unicode は検出されませんでした（${files.length} ファイル走査）。`)
}

// CLI として直接実行された場合のみ走査する（テストからの import 時は実行しない）
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main()
}
