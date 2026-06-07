import type { AppProps } from 'next/app'
import 'katex/dist/katex.min.css'
import { useTina } from 'tinacms/dist/react'
import client from '../tina/__generated__/client'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

type DocResult = Awaited<ReturnType<typeof client.queries.doc>>

// useTina は hook なので条件付き呼び出し不可 → 専用コンポーネントに分離
function TinaFormRegistrar(props: DocResult) {
  useTina(props)
  return null
}

// TinaCMS のビジュアル編集 iframe 内でのみ動作する
function TinaEditMode() {
  const router = useRouter()
  const [docData, setDocData] = useState<DocResult | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || window === window.parent) return

    const path = router.asPath.split('?')[0].split('#')[0]
    const candidates =
      path === '/'
        ? ['index.mdx']
        : [`${path.slice(1)}.mdx`, `${path.slice(1)}/index.mdx`]

    ;(async () => {
      for (const relativePath of candidates) {
        try {
          const result = await client.queries.doc({ relativePath })
          setDocData(result)
          return
        } catch {
          // 次の候補を試す
        }
      }
    })()
  }, [router.asPath])

  return docData ? <TinaFormRegistrar {...docData} /> : null
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <TinaEditMode />
      <Component {...pageProps} />
    </>
  )
}
