// Temporary diagnostic function: returns presence of key env vars (no secrets)
exports.handler = async function handler(event) {
  const info = {
    TINA_PUBLIC_IS_LOCAL: process.env.TINA_PUBLIC_IS_LOCAL ?? null,
    MONGO_URI_set: !!process.env.MONGO_URI,
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    GITHUB_OWNER_set: !!process.env.GITHUB_OWNER,
    GITHUB_REPO_set: !!process.env.GITHUB_REPO,
  }

  // Also print a short log line for Netlify Functions UI
  console.error('[env-debug]', JSON.stringify(info))

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(info),
  }
}
