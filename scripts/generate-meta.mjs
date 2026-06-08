/**
 * pages/docs/ 配下の .mdx ファイルのフロントマターを読んで
 * 各ディレクトリの _meta.json を自動生成するスクリプト。
 *
 * フロントマターで使えるフィールド:
 *   title:        サイドバーに表示するラベル（必須）
 *   sidebarOrder: 並び順（小さいほど上、省略時は 999）
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join, extname, basename } from 'path'

const DOCS_ROOT = 'pages'

// Next.js インフラ用ディレクトリ・ファイルは除外
const EXCLUDE_NAMES = new Set(['api', '_app.tsx', '_document.tsx', '_error.tsx', 'admin-redirect.tsx', 'tina-preview'])

/** YAML フロントマターを簡易パース（yaml パーサー不要） */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const result = {}
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const raw = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    result[key] = raw === '' ? undefined : isNaN(raw) ? raw : Number(raw)
  }
  return result
}

async function readFrontmatter(filePath) {
  try {
    return parseFrontmatter(await readFile(filePath, 'utf-8'))
  } catch {
    return {}
  }
}

async function generateMeta(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const items = []

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === '_meta.json') continue
    if (EXCLUDE_NAMES.has(entry.name)) continue

    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      await generateMeta(fullPath)
      // ディレクトリのラベル・順番は配下の index.mdx から取得
      const fm = await readFrontmatter(join(fullPath, 'index.mdx'))
      items.push({
        key: entry.name,
        label: fm.sidebarLabel ?? fm.title ?? entry.name,
        order: fm.sidebarOrder ?? 999,
        isIndex: false,
      })
    } else if (extname(entry.name) === '.mdx') {
      const key = basename(entry.name, '.mdx')
      const fm = await readFrontmatter(fullPath)
      items.push({
        key,
        label: fm.sidebarLabel ?? fm.title ?? key,
        order: fm.sidebarOrder ?? 999,
        isIndex: key === 'index',
      })
    }
  }

  // index を先頭に固定、残りは sidebarOrder → ラベル昇順でソート
  const index = items.find((i) => i.isIndex)
  const rest = items
    .filter((i) => !i.isIndex)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'ja'))

  const meta = {}
  if (index) meta['index'] = index.label
  for (const item of rest) meta[item.key] = item.label

  await writeFile(join(dir, '_meta.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(`✔ ${join(dir, '_meta.json')}`)
}

generateMeta(DOCS_ROOT).catch((err) => {
  console.error(err)
  process.exit(1)
})
