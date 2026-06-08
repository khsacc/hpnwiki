// Patch @heroicons/react v1 to add an ESM-compatible exports map.
//
// Node.js ESM resolution for `import "@heroicons/react/solid"`:
//   1. Look up @heroicons/react/package.json → check exports field
//   2. If no exports field → legacy resolution → resolves to solid/ directory
//   3. Directory import → ERR_UNSUPPORTED_DIR_IMPORT
//
// Fix: add exports to the *parent* @heroicons/react/package.json so that
// Node.js ESM resolves ./solid and ./outline to their esm/index.js files.
const { readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const root = resolve(__dirname, '..')
const pkgPath = resolve(root, 'node_modules/@heroicons/react/package.json')

try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

  if (!pkg.exports || !pkg.exports['./solid']) {
    pkg.exports = {
      ...pkg.exports,
      // ESM (import) uses esm/index.js; CJS (require) uses index.js
      './solid': { import: './solid/esm/index.js', require: './solid/index.js' },
      './solid/*': { import: './solid/esm/*.js', require: './solid/*.js' },
      './outline': { import: './outline/esm/index.js', require: './outline/index.js' },
      './outline/*': { import: './outline/esm/*.js', require: './outline/*.js' },
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log('patch-heroicons: patched @heroicons/react/package.json exports')
  }
} catch (e) {
  console.warn('patch-heroicons: failed to patch @heroicons/react:', e.message)
}
