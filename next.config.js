const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  latex: true,
  defaultShowCopyCode: true,
  flexsearch: {
    codeblocks: false,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Netlify Functions との疎通のためリライト設定（必要に応じて調整）
  async rewrites() {
    return []
  },
}

module.exports = withNextra(nextConfig)
