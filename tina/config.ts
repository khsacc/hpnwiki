import { defineConfig } from 'tinacms'
import { UsernamePasswordAuthJSProvider, TinaUserCollection } from 'tinacms-authjs/dist/tinacms'

const isLocal =
  process.env.TINA_PUBLIC_IS_LOCAL === 'true' || !process.env.MONGO_URI

// 新しいセクションを追加したらここにも追記する
const PAGE_DIRECTORIES = [
  { value: '',                                    label: 'トップレベル' },
  { value: 'references',                         label: '参考文献' },
  { value: 'documents',                          label: 'ドキュメント' },
  { value: 'documents/datacorrection',           label: 'ドキュメント > データ補正' },
  { value: 'att-data-resources',                 label: '減弱係数データリソース' },
  { value: 'cellassembly',                       label: 'セルアセンブリ' },
  { value: 'sample-att',                         label: 'サンプル吸収補正' },
  { value: 'tof-profile-functions',              label: 'TOFプロファイル関数' },
  { value: 'tof-profile-functions/bl11-pulse-shape', label: 'TOFプロファイル関数 > BL11パルス形状' },
]

function slugify(title: string): string {
  return (title || 'untitled')
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w぀-ヿ㐀-䶿一-鿿-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled'
}

export default defineConfig({
  // ローカル開発時は authProvider・contentApiUrlOverride を省略
  ...(!isLocal && {
    contentApiUrlOverride: '/api/tina/gql',
    authProvider: new UsernamePasswordAuthJSProvider(),
  }),
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
              const dir = (values.pageDirectory as string | undefined) ?? ''
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
