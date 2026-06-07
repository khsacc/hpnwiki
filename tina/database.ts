import { createDatabase, createLocalDatabase } from '@tinacms/datalayer'
import { MongodbLevel } from 'mongodb-level'
import { GitHubProvider } from 'tinacms-gitprovider-github'

// TINA_PUBLIC_IS_LOCAL=true、または MONGO_URI が未設定の場合はローカルモード
const isLocal =
  process.env.TINA_PUBLIC_IS_LOCAL === 'true' || !process.env.MONGO_URI

export default isLocal
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
