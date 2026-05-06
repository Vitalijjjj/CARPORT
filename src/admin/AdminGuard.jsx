import { Navigate } from 'react-router-dom'

/**
 * Wraps protected admin routes.
 * Reads the token from localStorage and verifies it hasn't expired
 * by decoding the base64 payload (matches the PHP generateToken format).
 */
export default function AdminGuard({ children }) {
  const token = localStorage.getItem('admin_token')

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  try {
    // JWT is header.payload.signature — payload is index 1 (not 0)
    // base64url → base64 before atob
    const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(payloadB64))

    // exp is in seconds (Unix timestamp)
    if (!payload.exp || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      return <Navigate to="/admin/login" replace />
    }
  } catch {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    return <Navigate to="/admin/login" replace />
  }

  return children
}
