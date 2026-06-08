// ESM compatibility patches for Node.js 22 / @netlify/plugin-nextjs v5.
//
// Problem: tinacms has "type":"module" so Node.js 22 loads it as ESM.
// Its ESM bundle (tinacms/dist/index.js) imports CJS packages with
// named-export syntax that fails in the Node.js ESM loader.
//
// The API routes don't use any tinacms React UI — they only need the
// @tinacms/datalayer / tinacms-authjs server utilities. So we patch the
// two places that drag tinacms into the server bundle:
//
// Patch 1 — @heroicons/react/package.json
//   tinacms does: import "@heroicons/react/solid"
//   Without an exports map, Node.js ESM resolves this as a directory
//   import → ERR_UNSUPPORTED_DIR_IMPORT.
//   Fix: add exports map to the parent @heroicons/react/package.json.
//
// Patch 2 — tinacms-authjs/dist/index.js
//   tinacms-authjs imports AbstractAuthProvider from "tinacms" but never
//   uses it (dead import left over from the source file). Removing the
//   import line prevents tinacms from being loaded at all in API routes.

const { readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const root = resolve(__dirname, '..')

// ─── Patch 1: @heroicons/react exports map ────────────────────────────────────
;(function patchHeroicons() {
  const pkgPath = resolve(root, 'node_modules/@heroicons/react/package.json')
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    if (!pkg.exports || !pkg.exports['./solid']) {
      pkg.exports = {
        ...pkg.exports,
        './solid':   { import: './solid/esm/index.js',   require: './solid/index.js' },
        './solid/*': { import: './solid/esm/*.js',        require: './solid/*.js' },
        './outline':   { import: './outline/esm/index.js', require: './outline/index.js' },
        './outline/*': { import: './outline/esm/*.js',     require: './outline/*.js' },
      }
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
      console.log('patch: @heroicons/react/package.json exports added')
    }
  } catch (e) {
    console.warn('patch: @heroicons/react failed:', e.message)
  }
})()

// ─── Patch 2: tinacms-authjs dead import removal ─────────────────────────────
;(function patchTinacmsAuthjs() {
  const distPath = resolve(root, 'node_modules/tinacms-authjs/dist/index.js')
  try {
    let src = readFileSync(distPath, 'utf8')
    const badImport = 'import { AbstractAuthProvider } from "tinacms";'
    if (src.includes(badImport)) {
      src = src.replace(badImport + '\n', '')
      writeFileSync(distPath, src)
      console.log('patch: tinacms-authjs/dist/index.js — removed unused tinacms import')
    }
  } catch (e) {
    console.warn('patch: tinacms-authjs failed:', e.message)
  }
})()
