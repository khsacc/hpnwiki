import type { NextApiRequest, NextApiResponse } from 'next'
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
import databaseClient from '../../../tina/__generated__/databaseClient'

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

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
