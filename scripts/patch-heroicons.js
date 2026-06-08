// Patch @heroicons/react v1 subpackages to add ESM exports field.
// Without this, Node.js ESM resolver throws ERR_UNSUPPORTED_DIR_IMPORT
// when tinacms (which has "type":"module") imports "@heroicons/react/solid".
const { readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const root = resolve(__dirname, '..')

for (const variant of ['solid', 'outline']) {
  const pkgPath = resolve(root, `node_modules/@heroicons/react/${variant}/package.json`)
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    if (!pkg.exports) {
      pkg.exports = {
        '.': {
          import: './esm/index.js',
          require: './index.js',
        },
      }
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
      console.log(`patch-heroicons: patched @heroicons/react/${variant}`)
    }
  } catch (e) {
    console.warn(`patch-heroicons: skipped @heroicons/react/${variant}: ${e.message}`)
  }
}
