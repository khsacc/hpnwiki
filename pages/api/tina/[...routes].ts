import * as fs from 'fs'
import * as path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
import * as crypto from 'crypto'
import { getToken } from 'next-auth/jwt'

async function checkPasswordHash({ saltedHash, password, opts = {} }: { saltedHash: string; password: string; opts?: any }) {
  const DEFAULT_SALT_LENGTH = 32
  const DEFAULT_KEY_LENGTH = 512
  const DEFAULT_ITERATIONS = 25000
  const DEFAULT_DIGEST = 'sha256'
  const {
    saltLength = DEFAULT_SALT_LENGTH,
    keyLength = DEFAULT_KEY_LENGTH,
    iterations = DEFAULT_ITERATIONS,
    digest = DEFAULT_DIGEST,
  } = opts || {}

  if (!saltedHash || typeof saltedHash !== 'string') return false
  const salt = saltedHash.slice(0, saltLength * 2)
  const hash = saltedHash.slice(saltLength * 2)
  try {
    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, derivedKey) => {
        if (err) return reject(err)
        resolve(derivedKey)
      })
    })
    const expected = Buffer.from(hash, 'hex')
    if (derived.length === expected.length && crypto.timingSafeEqual(derived, expected)) {
      return true
    }
  } catch (e) {
    return false
  }
  return false
}
import databaseClient from '../../../tina/__generated__/databaseClient'

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true' || !process.env.MONGO_URI
const USER_JSON_PATH = path.resolve(process.cwd(), 'content', 'users', 'index.json')

console.error('[tina-debug] runtime env: TINA_PUBLIC_IS_LOCAL=%s, MONGO_URI=%s, NEXTAUTH_SECRET=%s',
  process.env.TINA_PUBLIC_IS_LOCAL,
  process.env.MONGO_URI ? '[redacted]' : 'undefined',
  process.env.NEXTAUTH_SECRET ? '[redacted]' : 'undefined')

function loadFallbackUser(username: string) {
  try {
    const fileContents = fs.readFileSync(USER_JSON_PATH, 'utf8')
    const usersJson = JSON.parse(fileContents)
    return Array.isArray(usersJson.users)
      ? usersJson.users.find((user: any) => user.username === username)
      : undefined
  } catch (error) {
    console.error('[tina-debug] failed to load fallback users file', USER_JSON_PATH, error)
    return undefined
  }
}

function buildAuthUserResponse(user: any) {
  return {
    id: user.username,  // next-auth uses 'id' to set jwt.sub; must NOT be 'username'
    name: user.name,
    email: user.email,
    _password: {
      passwordChangeRequired: !!user?.password?.passwordChangeRequired,
    },
  }
}

const databaseClientWithFallback = {
  ...databaseClient,
  async authenticate({ username, password }: { username: string; password: string }) {
    try {
      const result = await databaseClient.authenticate({ username, password })
      if (result?.data?.authenticate) {
        return result
      }
    } catch (error) {
      console.error('[tina-debug] database authenticate error', error)
    }

    const fallbackUser = loadFallbackUser(username)
    if (fallbackUser && fallbackUser.password && typeof fallbackUser.password.value === 'string') {
      const matches = await checkPasswordHash({ saltedHash: fallbackUser.password.value, password })
      if (matches) {
        console.error('[tina-debug] authenticate fallback succeeded for user', username)
        return { data: { authenticate: buildAuthUserResponse(fallbackUser) } }
      }
    }
    return { data: { authenticate: null } }
  },
  async authorize({ sub }: { sub: string }) {
    try {
      const result = await databaseClient.authorize({ sub })
      if (result?.data?.authorize) {
        return result
      }
    } catch (error) {
      console.error('[tina-debug] database authorize error', error)
    }

    const fallbackUser = loadFallbackUser(sub)
    if (fallbackUser) {
      console.error('[tina-debug] authorize fallback succeeded for user', sub)
      return { data: { authorize: buildAuthUserResponse(fallbackUser) } }
    }
    return { data: { authorize: null } }
  },
}

const tinaHandler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient: databaseClientWithFallback,
          secret: process.env.NEXTAUTH_SECRET!,
        }),
      }),
  databaseClient: databaseClientWithFallback,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.error('[tina-debug] request', JSON.stringify({
    method: req.method,
    url: req.url,
    query: req.query,
    hasBody: !!req.body,
    bodyQuery: typeof req.body === 'object' && req.body && typeof (req.body as any).query === 'string',
  }))

  // 保存時に更新日・最終編集者を自動セット（GQL mutation で createDoc / updateDoc が来たとき）
  if (req.method === 'POST' && req.body) {
    const body = req.body as { query?: string; variables?: { params?: Record<string, unknown> } }
    if (
      typeof body.query === 'string' &&
      /\b(createDoc|updateDoc)\b/.test(body.query) &&
      body.variables?.params
    ) {
      body.variables.params.date = new Date().toISOString()
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      body.variables.params.lastEditor = (token?.name as string | undefined) || 'Admin'
    }
  }
  try {
    // Debug helper: if an authenticate GraphQL request is received, fetch
    // the raw users document from the Tina database and log a compact
    // summary to help diagnose missing password fields at runtime.
    try {
      const body = req.body as { query?: string; variables?: any }
      if (typeof body.query === 'string' && /\bauthenticate\b/.test(body.query)) {
        console.error('[tina-debug] authenticate query from request')
        try {
          // request the raw user document via the generated database client
          const dbgQ = `query dbg { user(relativePath: "index.json") { users { username password { value passwordChangeRequired } } } }`
          const dbgRes = await databaseClient.request({ query: dbgQ, variables: {}, user: undefined })
          const users = dbgRes.data?.user?.users
          if (Array.isArray(users)) {
            const summary = users.map((u: any) => ({
              username: u.username,
              hasPasswordObject: !!(u.password && typeof u.password === 'object'),
              hasPasswordValue: !!(u.password && typeof u.password === 'object' && !!u.password.value),
              passwordValuePreview: u.password && u.password.value ? String(u.password.value).slice(0, 8) + '...' : null,
            }))
            console.error('[tina-debug] users summary:', JSON.stringify(summary))
          } else {
            console.error('[tina-debug] users not found or not an array:', String(users))
          }
        } catch (e) {
          console.error('[tina-debug] failed to fetch users doc for debug:', e)
        }
      }
    } catch (e) {
      console.error('[tina-debug] debug-helper failure:', e)
    }
    return await tinaHandler(req, res)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[tina] unhandled error:', err)
    if (!res.headersSent) {
      res.status(500).json({ tinaError: msg, stack })
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
