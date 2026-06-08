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
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // tinacms@3.x dynamically imports Node built-ins (fs, path, os, crypto) for caching;
      // these are unused in the browser so mark them absent
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      }
    }
    // tinacms@3.x uses node: protocol imports; strip the prefix so webpack can resolve them
    const { NormalModuleReplacementPlugin } = require('webpack')
    config.plugins.push(
      new NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '')
      })
    )
    return config
  },
}

module.exports = withNextra(nextConfig)
