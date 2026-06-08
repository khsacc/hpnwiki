import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import { useTina } from 'tinacms/dist/react'
import client from '../../tina/__generated__/client'

type DocResult = Awaited<ReturnType<typeof client.queries.doc>>

// ---- デバッグパネル -------------------------------------------------------
function DebugLog({ lines }: { lines: string[] }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      maxHeight: '25vh', overflowY: 'auto',
      background: 'rgba(0,0,0,0.85)', color: '#0f0',
      fontFamily: 'monospace', fontSize: '11px',
      padding: '0.5rem', zIndex: 9999,
      borderTop: '2px solid #0f0',
    }}>
      <strong style={{ color: '#ff0' }}>[tina-preview debug]</strong>
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  )
}

// ---- useTina でデータを受け取り表示 ----------------------------------------
function PreviewContent(props: DocResult) {
  const renderCount = useRef(0)
  renderCount.current++

  const { data } = useTina(props)
  const doc = data.doc
  const body = (doc as Record<string, unknown>).body as string | null | undefined

  console.log('[tina-preview] PreviewContent render #%d | title=%s | bodyLen=%d',
    renderCount.current, doc.title, body?.length ?? 0)

  return (
    <div style={{
      padding: '2rem 3rem',
      maxWidth: '860px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: '16px',
      lineHeight: 1.7,
      color: '#1a1a1a',
      paddingBottom: '30vh',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.3 }}>
        {doc.title}
      </h1>
      <pre style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'inherit',
        margin: 0,
        fontSize: '14px',
      }}>
        {body ?? '(本文なし)'}
      </pre>
    </div>
  )
}

// ---- メインページ -----------------------------------------------------------
export default function TinaPreviewPage() {
  const router = useRouter()
  const [docData, setDocData] = useState<DocResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugLines, setDebugLines] = useState<string[]>([])

  function addLog(msg: string) {
    const ts = new Date().toISOString().slice(11, 23)
    console.log('[tina-preview]', msg)
    setDebugLines(prev => [`[${ts}] ${msg}`, ...prev].slice(0, 60))
  }

  // ① ページロード・iframe 検出・postMessage 監視
  useEffect(() => {
    const inIframe = window !== window.parent
    addLog(`ページロード完了 | inIframe=${inIframe} | href=${window.location.href}`)

    const handler = (e: MessageEvent) => {
      const typeStr = typeof e.data === 'object'
        ? (e.data?.type ?? JSON.stringify(e.data).slice(0, 80))
        : String(e.data).slice(0, 80)
      addLog(`postMessage受信 | origin=${e.origin} | type=${typeStr}`)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ② path セグメントから relativePath を復元してフェッチ
  const pathSegments = Array.isArray(router.query.path)
    ? router.query.path
    : router.query.path
      ? [router.query.path]
      : null

  const relativePath = pathSegments ? pathSegments.join('/') : null

  useEffect(() => {
    if (!relativePath) {
      addLog(`router.query.path=未設定 (ルーティング未完了)`)
      return
    }
    addLog(`relativePath="${relativePath}"`)
    setDocData(null)
    setError(null)

    client.queries.doc({ relativePath })
      .then(result => {
        addLog(`GraphQL 成功 | title=${result.data.doc.title} | query長=${result.query.length}`)
        setDocData(result)
      })
      .catch((e: unknown) => {
        addLog(`GraphQL 失敗: ${String(e)}`)
        setError(String(e))
      })
  }, [relativePath])

  return (
    <>
      {error && (
        <div style={{ padding: '2rem', color: '#c00', fontFamily: 'monospace' }}>
          エラー: {error}
        </div>
      )}
      {!error && !docData && (
        <div style={{ padding: '2rem', color: '#888' }}>読み込み中... (path: {relativePath ?? '未設定'})</div>
      )}
      {docData && <PreviewContent {...docData} />}
      <DebugLog lines={debugLines} />
    </>
  )
}
