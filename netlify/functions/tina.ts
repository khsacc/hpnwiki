/**
 * Netlify Functions による TinaCMS バックエンドハンドラー
 *
 * Next.js on Netlify では pages/api/tina/[...routes].ts が
 * @netlify/plugin-nextjs により自動変換されるため、通常はそちらを使用します。
 * このファイルは Next.js プラグインを使わない構成向けの代替実装です。
 */
import type { Handler, HandlerEvent } from '@netlify/functions'
import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
import database from '../../tina/database'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

const tinaBackend = TinaNodeBackend({
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

function buildNodeRequest(event: HandlerEvent): IncomingMessage {
  const req = new IncomingMessage(new Socket())
  req.method = event.httpMethod
  req.url =
    event.path +
    (event.queryStringParameters
      ? '?' +
        new URLSearchParams(
          event.queryStringParameters as Record<string, string>
        ).toString()
      : '')

  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (value !== undefined) req.headers[key.toLowerCase()] = value
  }

  if (event.body) {
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body)
    req.push(bodyBuffer)
  }
  req.push(null)
  return req
}

export const handler: Handler = (event) =>
  new Promise((resolve) => {
    const req = buildNodeRequest(event)
    const chunks: Buffer[] = []
    const res = new ServerResponse(req)

    const originalWrite = res.write.bind(res)
    res.write = (chunk: any, ...args: any[]) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      return originalWrite(chunk, ...args)
    }

    const originalEnd = res.end.bind(res)
    res.end = (chunk?: any, ...args: any[]) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }

      const headers: Record<string, string> = {}
      for (const [key, value] of Object.entries(res.getHeaders())) {
        if (value !== undefined) {
          headers[key] = Array.isArray(value) ? value.join(', ') : String(value)
        }
      }

      resolve({
        statusCode: res.statusCode,
        headers,
        body: Buffer.concat(chunks).toString('utf8'),
      })

      return originalEnd(chunk, ...args)
    }

    tinaBackend(req as any, res as any)
  })
