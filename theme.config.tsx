import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { useConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>HPN Wiki</span>,
  project: {
    link: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}`,
  },
  docsRepositoryBase: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/blob/main`,
  footer: {
    text: (
      <span>
        © {new Date().getFullYear()} HPN Wiki. All rights reserved.
      </span>
    ),
  },
  useNextSeoProps() {
    const { frontMatter } = useConfig()
    return {
      titleTemplate: '%s – HPN Wiki',
      description: frontMatter.description ?? 'HPN Wiki',
    }
  },
  head() {
    const { frontMatter } = useConfig()
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={frontMatter.description ?? 'HPN Wiki'} />
      </>
    )
  },
  editLink: {
    text: 'GitHub でこのページを編集',
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
  },
  search: {
    placeholder: 'ドキュメントを検索...',
  },
  i18n: [],
}

export default config
