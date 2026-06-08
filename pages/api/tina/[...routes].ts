import type { NextApiRequest, NextApiResponse } from 'next'
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
import databaseClient from '../../../tina/__generated__/databaseClient'

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true' || !process.env.MONGO_URI

console.error('[tina-debug] runtime env: TINA_PUBLIC_IS_LOCAL=%s, MONGO_URI=%s, NEXTAUTH_SECRET=%s',
  process.env.TINA_PUBLIC_IS_LOCAL,
  process.env.MONGO_URI ? '[redacted]' : 'undefined',
  process.env.NEXTAUTH_SECRET ? '[redacted]' : 'undefined')

const tinaHandler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient,
          secret: process.env.NEXTAUTH_SECRET!,
        }),
      }),
  databaseClient,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.error('[tina-debug] request', JSON.stringify({
    method: req.method,
    url: req.url,
    query: req.query,
    hasBody: !!req.body,
    bodyQuery: typeof req.body === 'object' && req.body && typeof (req.body as any).query === 'string',
  }))

  // 保存時に更新日を自動セット（GQL mutation で createDoc / updateDoc が来たとき）
  if (req.method === 'POST' && req.body) {
    const body = req.body as { query?: string; variables?: { params?: Record<string, unknown> } }
    if (
      typeof body.query === 'string' &&
      /\b(createDoc|updateDoc)\b/.test(body.query) &&
      body.variables?.params
    ) {
      body.variables.params.date = new Date().toISOString()
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
          const dbgRes = await databaseClient.request({ query: dbgQ, variables: {} })
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
