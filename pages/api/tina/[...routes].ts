import { TinaNodeBackend, LocalBackendAuthProvider } from '@tinacms/datalayer'
import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from 'tinacms-authjs'
import database from '../../../tina/database'

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true'

const handler = TinaNodeBackend({
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

export default handler

export const config = {
  api: {
    bodyParser: false,
  },
}
