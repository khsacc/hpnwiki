// Directly writes user data from content/users/index.json into MongoDB,
// bypassing TinaCMS's "skip if not empty" guard on the detached user collection.
//
// Background: TinaCMS only indexes the isDetached user collection into MongoDB
// the FIRST time (when the appLevel sublevel is empty). After that, changes to
// content/users/index.json are silently ignored. This script force-syncs the
// source JSON to the expected MongoDB key so authentication works.
//
// MongoDB key for user document:
//   !_appData!!user!!~!content/users/index.json
// (abstract-level sublevel prefix: root → _appData → user → ~ content root)

'use strict'

const { MongoClient } = require('mongodb')
const { readFileSync } = require('fs')
const { resolve } = require('path')

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) {
  console.log('migrate-users: MONGO_URI not set, skipping (local mode)')
  process.exit(0)
}

const DB_NAME = 'tinacms'
const COLLECTION_NAME = 'tinacms'
const USER_DOC_KEY = '!_appData!!user!!~!content/users/index.json'

async function main() {
  const usersPath = resolve(__dirname, '..', 'content', 'users', 'index.json')
  const usersJson = JSON.parse(readFileSync(usersPath, 'utf8'))

  const client = new MongoClient(MONGO_URI)
  try {
    await client.connect()
    const col = client.db(DB_NAME).collection(COLLECTION_NAME)

    const existing = await col.findOne({ key: USER_DOC_KEY })
    if (existing) {
      console.log('migrate-users: existing value =', JSON.stringify(existing.value).slice(0, 200))
    } else {
      console.log('migrate-users: no existing document found, will create')
    }

    await col.updateOne(
      { key: USER_DOC_KEY },
      { $set: { value: usersJson } },
      { upsert: true }
    )
    console.log('migrate-users: user document written successfully')
    console.log('migrate-users: user count =', usersJson.users?.length)
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error('migrate-users: FAILED', err.message)
  process.exit(1)
})
