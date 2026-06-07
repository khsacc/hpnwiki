import { defineConfig } from 'tinacms'
import { UsernamePasswordAuthJSProvider, TinaUserCollection } from 'tinacms-authjs/dist/tinacms'

const isLocal =
  process.env.TINA_PUBLIC_IS_LOCAL === 'true' || !process.env.MONGO_URI

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
        path: 'pages/docs',
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
            type: 'datetime',
            name: 'date',
            label: '更新日',
          },
          {
            type: 'string',
            name: 'description',
            label: '概要',
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'string',
            name: 'tags',
            label: 'タグ',
            list: true,
          },
          {
            type: 'rich-text',
            name: 'body',
            label: '本文',
            isBody: true,
          },
        ],
        ui: {
          router: ({ document }) => {
            const crumbs = document._sys.breadcrumbs
            // index ファイルは末尾の "index" を除去
            const segments = crumbs[crumbs.length - 1] === 'index'
              ? crumbs.slice(0, -1)
              : crumbs
            return segments.length > 0 ? `/docs/${segments.join('/')}` : '/docs'
          },
        },
      },
    ],
  },
})
