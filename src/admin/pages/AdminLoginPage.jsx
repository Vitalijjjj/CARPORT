import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiLogin } from '../adminApi'
import a from '../adminLang'
import '../Admin.css'

function validate(form) {
  const errors = {}
  if (!form.email.trim()) {
    errors.email = a.login.errEmailRequired
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = a.login.errEmailInvalid
  }
  if (!form.password) {
    errors.password = a.login.errPasswordRequired
  }
  return errors
}

export default function AdminLoginPage() {
  const navigate = useNavigate()

  const [form,        setForm]        = useState({ email: '', password: '' })
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [serverError, setServerError] = useState('')

  function handleChange(field) {
    return e => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
      setServerError('')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setServerError('')

    try {
      const { token, admin } = await apiLogin(form.email.trim(), form.password)
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_user', JSON.stringify(admin))
      navigate('/admin')
    } catch (err) {
      setServerError(err.message || a.login.errInvalid)
    }

    setLoading(false)
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-logo">
          <span className="admin-login-logo-text">TURBOEAGLE</span>
          <span className="admin-login-logo-badge">Admin</span>
        </div>

        <h1 className="admin-login-title">{a.login.title}</h1>

        {serverError && (
          <div className="admin-login-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          <div className="admin-login-field">
            <label className="af-label" htmlFor="login-email">{a.login.email}</label>
            <input
              id="login-email"
              type="email"
              className={`af-input${errors.email ? ' af-input--error' : ''}`}
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
              autoFocus
              placeholder={a.login.emailPlaceholder}
              disabled={loading}
            />
            {errors.email && (
              <span className="af-error-msg" role="alert">{errors.email}</span>
            )}
          </div>

          <div className="admin-login-field">
            <label className="af-label" htmlFor="login-password">{a.login.password}</label>
            <input
              id="login-password"
              type="password"
              className={`af-input${errors.password ? ' af-input--error' : ''}`}
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.password && (
              <span className="af-error-msg" role="alert">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn-admin-primary btn-admin-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? a.login.submitting : a.login.submit}
          </button>

        </form>

        <p className="admin-login-back">
          <Link to="/" className="admin-link">{a.login.back}</Link>
        </p>

      </div>
    </div>
  )
}
