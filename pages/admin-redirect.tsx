import { useEffect } from 'react'

// /admin-redirect → /admin/index.html#/collections/doc にクライアントサイドでリダイレクト
export default function AdminRedirect() {
  useEffect(() => {
    window.location.replace('/admin/index.html#/collections/doc')
  }, [])
  return null
}
