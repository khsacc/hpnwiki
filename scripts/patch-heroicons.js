// ESM compatibility patches for Node.js 22 / @netlify/plugin-nextjs v5.
//
// Root cause: all @tinacms/* and tinacms-authjs packages have "type":"module".
// Node.js 22 loads them as ESM via the new require(esm) feature.
// These ESM bundles import CJS packages from next-auth and others, causing
// several interop failures:
//
// Patch 1 — @heroicons/react/package.json
//   tinacms: import "@heroicons/react/solid"
//   No exports map → legacy resolution finds a directory → ERR_UNSUPPORTED_DIR_IMPORT
//   Fix: add ./solid and ./outline to the parent @heroicons/react exports map.
//
// Patch 2 — tinacms-authjs: remove dead tinacms import
//   import { AbstractAuthProvider } from "tinacms"   (never used)
//   This would force-load tinacms (React UI bundle) in server context.
//   Fix: remove the unused import line.
//
// Patch 3 — tinacms-authjs: fix __esModule default-import unwrapping
//   next-auth CJS modules set __esModule:true with exports.default = fn.
//   In Node.js ESM, `import X from "next-auth"` gives X = module.exports
//   (the whole object), NOT module.exports.default.
//   So CredentialsProvider({}) crashes: "CredentialsProvider is not a function".
//   Fix: rename the imports and extract .default when __esModule is set.

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
        './solid':     { import: './solid/esm/index.js',   require: './solid/index.js' },
        './solid/*':   { import: './solid/esm/*.js',        require: './solid/*.js' },
        './outline':   { import: './outline/esm/index.js', require: './outline/index.js' },
        './outline/*': { import: './outline/esm/*.js',     require: './outline/*.js' },
      }
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
      console.log('patch: @heroicons/react exports map added')
    }
  } catch (e) {
    console.warn('patch: @heroicons/react failed:', e.message)
  }
})()

// ─── Patch 2 + 3: tinacms-authjs ─────────────────────────────────────────────
;(function patchTinacmsAuthjs() {
  const distPath = resolve(root, 'node_modules/tinacms-authjs/dist/index.js')
  try {
    let src = readFileSync(distPath, 'utf8')
    let changed = false

    // Patch 2: remove dead tinacms import (forces loading of 72k-line UI bundle)
    const deadImport = 'import { AbstractAuthProvider } from "tinacms";\n'
    if (src.includes(deadImport)) {
      src = src.replace(deadImport, '')
      changed = true
      console.log('patch: tinacms-authjs — removed unused tinacms import')
    }

    // Patch 3: fix __esModule default-import unwrapping for next-auth CJS modules.
    // `import NextAuth from "next-auth"` → NextAuth = module.exports (object, not fn)
    // We rename the import binding and unwrap .default manually.
    const oldNextAuth = 'import NextAuth from "next-auth";'
    const newNextAuth = [
      'import _NextAuthMod from "next-auth";',
      'var NextAuth = _NextAuthMod && _NextAuthMod.__esModule ? _NextAuthMod.default : _NextAuthMod;',
    ].join('\n')
    if (src.includes(oldNextAuth)) {
      src = src.replace(oldNextAuth, newNextAuth)
      changed = true
      console.log('patch: tinacms-authjs — unwrapped NextAuth __esModule default')
    }

    const oldCredentials = 'import CredentialsProvider from "next-auth/providers/credentials";'
    const newCredentials = [
      'import _CredentialsMod from "next-auth/providers/credentials";',
      'var CredentialsProvider = _CredentialsMod && _CredentialsMod.__esModule ? _CredentialsMod.default : _CredentialsMod;',
    ].join('\n')
    if (src.includes(oldCredentials)) {
      src = src.replace(oldCredentials, newCredentials)
      changed = true
      console.log('patch: tinacms-authjs — unwrapped CredentialsProvider __esModule default')
    }

    if (changed) writeFileSync(distPath, src)
  } catch (e) {
    console.warn('patch: tinacms-authjs failed:', e.message)
  }
})()
