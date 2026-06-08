import { defineConfig } from 'tinacms'
import { UsernamePasswordAuthJSProvider, TinaUserCollection } from 'tinacms-authjs/dist/tinacms'

const isBrowser = typeof window !== 'undefined'
const isLocal = !isBrowser && (process.env.TINA_PUBLIC_IS_LOCAL === 'true' || !process.env.MONGO_URI)

if (!isBrowser) {
  console.error('[tina-build] build env: isBrowser=%s, isLocal=%s, TINA_PUBLIC_IS_LOCAL=%s, MONGO_URI_set=%s',
    isBrowser,
    isLocal,
    process.env.TINA_PUBLIC_IS_LOCAL,
    !!process.env.MONGO_URI,
  )
}

if (!isBrowser && !isLocal && !process.env.MONGO_URI) {
  throw new Error(
    'TinaCMS production mode requires MONGO_URI. Set TINA_PUBLIC_IS_LOCAL=true for local development.'
  )
}

function getPageDirectories() {
  if (isBrowser) return [{ value: '', label: 'トップレベル' }]
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { readdirSync } = require('fs') as typeof import('fs')
    const dirs = readdirSync('pages', { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'api')
      .map(d => ({ value: d.name, label: d.name }))
    return [{ value: '', label: 'トップレベル' }, ...dirs]
  } catch {
    return [{ value: '', label: 'トップレベル' }]
  }
}

const PAGE_DIRECTORIES = getPageDirectories()

function slugify(title: string): string {
  return (title || 'untitled')
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w぀-ヿ㐀-䶿一-鿿-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled'
}

export default defineConfig({
  // Tina 管理画面の静的ビルドでも必要なので常に指定する
  contentApiUrlOverride: '/api/tina/gql',
  ...(isLocal ? {} : { authProvider: new UsernamePasswordAuthJSProvider() }),
  build: {
    publicFolder: 'public',
    outputFolder: 'admin',
  },
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      TinaUserCollection,
      {
        name: 'doc',
        label: 'ドキュメント',
        path: 'pages',
        format: 'mdx',
        fields: [
          {
            type: 'string',
            name: 'title',
            label: 'タイトル',
            isTitle: true,
            required: true,
          },
          {
            // 新規作成時に格納先ディレクトリを選択するフィールド
            // slugify で filename に反映される。編集時に変更しても移動はされない。
            type: 'string',
            name: 'pageDirectory',
            label: '格納先（新規作成時に選択）',
            options: PAGE_DIRECTORIES,
          },
          {
            // 新規セクション作成時のみ使用。既存セクションへの追加は上の「格納先」を使う。
            type: 'string',
            name: 'newSectionName',
            label: '新規セクション名（新セクション作成時のみ入力）',
            ui: {
              description: '新しいセクションを作る場合のみ英数字で入力（例: my-section）。上の「格納先」より優先されます。',
            },
          },
          {
            type: 'number',
            name: 'sidebarOrder',
            label: 'サイドバー表示順（小さいほど上）',
          },
          {
            type: 'datetime',
            name: 'date',
            label: '更新日',
            ui: { component: null },  // 保存時に API ルートで自動セット
          },
          {
            type: 'string',
            name: 'tags',
            label: 'タグ',
            list: true,
          },
          {
            type: 'object',
            name: 'attachments',
            label: '添付ファイル',
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.label ?? item?.path ?? '添付ファイル',
              }),
            },
            fields: [
              {
                type: 'string',
                name: 'label',
                label: '表示名',
              },
              {
                type: 'image',
                name: 'path',
                label: 'ファイル',
              },
            ],
          },
          {
            type: 'string',
            name: 'body',
            label: '本文（MDX／KaTeX 対応）',
            isBody: true,
            ui: {
              component: 'textarea',
            },
          },
        ],
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              const dir = (values.newSectionName as string | undefined)?.trim()
                || (values.pageDirectory as string | undefined)
                || ''
              const slug = slugify(values.title as string)
              return dir ? `${dir}/${slug}` : slug
            },
          },
          router: ({ document }) => {
            const crumbs = document._sys.breadcrumbs
            const segments =
              crumbs[crumbs.length - 1] === 'index'
                ? crumbs.slice(0, -1)
                : crumbs
            return segments.length > 0 ? `/${segments.join('/')}` : '/'
          },
        },
      },
    ],
  },
})
