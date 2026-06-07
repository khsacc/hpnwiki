import type { NextApiRequest, NextApiResponse } from 'next'
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
import database from '../../../tina/database'

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

const tinaHandler = TinaNodeBackend({
  authProvider: isLocal
    ? LocalBackendAuthProvider()
    : AuthJsBackendAuthProvider({
        authOptions: TinaAuthJSOptions({
          databaseClient: database,
          secret: process.env.NEXTAUTH_SECRET!,
        }),
      }),
  databaseClient: database,
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
  return tinaHandler(req, res)
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
