import { createDatabase, createLocalDatabase } from '@tinacms/datalayer'
import { MongodbLevel } from 'mongodb-level'
import { GitHubProvider } from 'tinacms-gitprovider-github'

const isBrowser = typeof window !== 'undefined'
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true' || !process.env.MONGO_URI

if (!isBrowser && !isLocal && !process.env.MONGO_URI) {
  throw new Error(
    'TinaCMS production mode requires MONGO_URI. Set TINA_PUBLIC_IS_LOCAL=true for local development.'
  )
}

// MDX ファイルを書き込む際に date を現在時刻に自動更新する
function withAutoDate<T extends { put: (...args: any[]) => Promise<any> }>(db: T): T {
  const originalPut = db.put.bind(db)
  ;(db as any).put = async (filepath: string, data: unknown, collectionName?: string) => {
    if (typeof filepath === 'string' && filepath.endsWith('.mdx') && data !== null && typeof data === 'object') {
      (data as Record<string, unknown>).date = new Date().toISOString()
    }
    return originalPut(filepath, data, collectionName)
  }
  return db
}

const db = !isBrowser
  ? isLocal
    ? createLocalDatabase()
    : createDatabase({
        gitProvider: new GitHubProvider({
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
          branch: process.env.GITHUB_BRANCH ?? 'main',
        }),
        databaseAdapter: new MongodbLevel<string, Record<string, any>>({
          collectionName: 'tinacms',
          dbName: 'tinacms',
          mongoUri: process.env.MONGO_URI!,
        }),
      })
  : (undefined as any)

export default !isBrowser ? withAutoDate(db) : (undefined as any)
