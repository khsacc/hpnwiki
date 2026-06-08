import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { useConfig } from 'nextra-theme-docs'

type Attachment = { label?: string; path: string }

function LastEditedInfo() {
  const { frontMatter } = useConfig()
  const date = frontMatter.date as string | undefined
  const lastEditor = (frontMatter.lastEditor as string | undefined) ?? 'Admin'
  if (!date) return null
  const formatted = new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return (
    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
      最終更新: {formatted}（{lastEditor}）
    </span>
  )
}

function AttachmentsTocSection() {
  const { frontMatter } = useConfig()
  const attachments = frontMatter.attachments as Attachment[] | undefined
  if (!attachments?.length) return null

  return (
    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--nextra-border)' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        添付ファイル
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {attachments.map((att) => {
          const name = att.label ?? att.path.split('/').pop() ?? att.path
          const ext = att.path.split('.').pop()?.toLowerCase() ?? ''
          const canView = new Set(['pdf', 'txt', 'csv', 'py', 'js', 'ts', 'md']).has(ext)
          return (
            <li key={att.path} style={{ marginBottom: '0.2rem' }}>
              <a
                href={att.path}
                target="_blank"
                rel="noopener noreferrer"
                download={!canView || undefined}
                style={{ fontSize: '0.8rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={name}
              >
                ↓ {name}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function AttachmentsSection() {
  const { frontMatter } = useConfig()
  const attachments = frontMatter.attachments as Attachment[] | undefined
  if (!attachments?.length) return null

  const ext = (p: string) => p.split('.').pop()?.toLowerCase() ?? ''
  const viewableInBrowser = new Set(['pdf', 'txt', 'csv', 'py', 'js', 'ts', 'md'])

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--nextra-border)' }}>
      <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>添付ファイル</p>
      <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', margin: 0 }}>
        {attachments.map((att) => {
          const name = att.label ?? att.path.split('/').pop() ?? att.path
          const canView = viewableInBrowser.has(ext(att.path))
          return (
            <li key={att.path} style={{ marginBottom: '0.25rem' }}>
              <a href={att.path} target="_blank" rel="noopener noreferrer" download={!canView || undefined}>
                {name}
              </a>
              {canView && (
                <>
                  {' '}(
                  <a href={att.path} target="_blank" rel="noopener noreferrer">
                    ブラウザで開く
                  </a>
                  {' / '}
                  <a href={att.path} download rel="noopener noreferrer">
                    ダウンロード
                  </a>
                  )
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Neutron @ Pressure Wiki</span>,
  project: {
    link: 'https://github.com/khsacc/hpnwiki',
  },
  navbar: {
    extraContent: (
      <a
        href="/admin/index.html#/collections/doc"
        target="_blank"
        rel="noopener noreferrer"
        title="CMS管理画面"
        style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', opacity: 0.7 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </a>
    ),
  },
  docsRepositoryBase: 'https://github.com/khsacc/hpnwiki/blob/main',
  footer: {
    text: (
      <span>
        Primary writer: kom (at) eqchem.s.u-tokyo.ac.jp<br />
        Development: hiroki (at) eqchem.s.u-tokyo.ac.jp
      </span>
    ),
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Neutron @ Pressure Wiki',
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </>
  ),
  editLink: {
    component: ({ filePath, className }) => {
      // docs ページ以外（トップページなど）にはボタンを表示しない
      if (!filePath?.endsWith('.mdx') || filePath.startsWith('pages/api/')) return null

      // filePath 例: 'pages/documents/intro2atten.mdx'
      // TinaCMS の URL は breadcrumbs.join("/") 形式 → 拡張子なし
      // pages/a/b/index.mdx → "a/b", pages/a/b.mdx → "a/b", pages/index.mdx → ""
      const relative = filePath.slice('pages/'.length).replace(/\.mdx$/, '')
      const routerPath = relative.replace(/(\/index|^index)$/, '')
      const editUrl = `/admin/index.html#/~${routerPath ? `/${routerPath}` : ''}`

      return (
        <a
          href={editUrl}
          className={className}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3em' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          このページを編集
        </a>
      )
    },
  },
  feedback: {
    content: 'フィードバックを送る →',
    labels: 'feedback',
  },
  sidebar: {
    titleComponent({ title }) {
      return <>{title}</>
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
    title: '目次',
    extraContent: <AttachmentsTocSection />,
  },
  gitTimestamp: <LastEditedInfo />,
  search: {
    placeholder: 'ドキュメントを検索...',
  },
  i18n: [],
  main: ({ children }) => (
    <>
      {children}
      <AttachmentsSection />
    </>
  ),
}

export default config
