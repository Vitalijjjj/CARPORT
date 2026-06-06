import { useState, useEffect, useRef } from 'react'
import {
  apiGetReviews, apiCreateReview, apiUpdateReview, apiDeleteReview, apiUploadImage,
} from '../adminApi'
import a from '../adminLang'

const EMPTY_REVIEW = {
  name: '', location: '', title: '', quote: '',
  rating: 5, badge: '', lang: 'all', status: 'visible',
  sort_order: 0, image: '',
}

const LANG_LABELS = {
  all: () => a.reviews.langAll,
  pt:  () => a.reviews.langPt,
  en:  () => a.reviews.langEn,
  uk:  () => a.reviews.langUk,
}

export default function AdminReviewsPage() {
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [toast,    setToast]    = useState(null)
  const [editing,  setEditing]  = useState(null)   // review object (with id) or {} for new, null = closed
  const [deleting, setDeleting] = useState(null)    // review to delete or null

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function load() {
    setLoading(true)
    apiGetReviews()
      .then(data => { setReviews(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }

  useEffect(() => {
    apiGetReviews()
      .then(data => { setReviews(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  async function handleDelete() {
    if (!deleting) return
    try {
      await apiDeleteReview(deleting.id)
      setDeleting(null)
      showToast(a.reviews.deleted)
      load()
    } catch (err) {
      showToast(err.message || a.reviews.deleteFailed, 'error')
    }
  }

  return (
    <div className="admin-page">

      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`} role="alert">
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{a.reviews.title}</h1>
          <p className="admin-page-sub">{a.reviews.subtitle(reviews.length)}</p>
        </div>
        <button className="btn-admin-primary" onClick={() => setEditing({ ...EMPTY_REVIEW })}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {a.reviews.add}
        </button>
      </div>

      {error && <div className="admin-error-banner">{a.reviews.failedToLoad} {error}</div>}

      {/* List */}
      <div className="admin-section-card">
        {loading ? (
          <div className="admin-loading-sm"><div className="admin-spinner" /></div>
        ) : reviews.length === 0 ? (
          <div className="admin-empty-sm">
            {a.reviews.empty} &nbsp;
            <button className="admin-link" onClick={() => setEditing({ ...EMPTY_REVIEW })}>{a.reviews.addFirst}</button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{a.reviews.colClient}</th>
                <th>{a.reviews.colReview}</th>
                <th>{a.reviews.colRating}</th>
                <th>{a.reviews.colLang}</th>
                <th>{a.reviews.colStatus}</th>
                <th style={{ width: 110 }}>{a.reviews.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(rev => (
                <tr key={rev.id}>
                  <td>
                    <div className="admin-car-cell">
                      {rev.image
                        ? <img src={rev.image} alt="" className="admin-car-thumb" />
                        : <div className="admin-car-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f6', color: '#64748b', fontWeight: 600 }}>{(rev.name || '?').charAt(0).toUpperCase()}</div>
                      }
                      <div>
                        <div className="admin-car-name">{rev.name || '—'}</div>
                        <div className="admin-car-meta">{rev.location || rev.badge || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ maxWidth: 320 }}>
                    <div className="admin-car-name" style={{ fontWeight: 500 }}>{rev.title || ''}</div>
                    <div className="admin-car-meta" style={{ whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{rev.quote || ''}</div>
                  </td>
                  <td style={{ color: '#f59e0b', letterSpacing: 1 }}>{'★'.repeat(Math.max(0, Math.min(5, rev.rating)))}</td>
                  <td>{(LANG_LABELS[rev.lang] || LANG_LABELS.all)()}</td>
                  <td>
                    <span className={`admin-status-badge admin-status--${rev.status === 'visible' ? 'green' : 'slate'}`}>
                      {rev.status === 'visible' ? a.reviews.visible : a.reviews.hidden}
                    </span>
                  </td>
                  <td>
                    <button className="admin-link" onClick={() => setEditing(rev)}>{a.reviews.edit}</button>
                    {' · '}
                    <button className="admin-link" style={{ color: '#ef4444' }} onClick={() => setDeleting(rev)}>{a.reviews.delete}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create modal */}
      {editing && (
        <ReviewFormModal
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
          onToast={showToast}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="admin-modal-backdrop" onClick={() => setDeleting(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>{a.reviews.deleteTitle}</h3>
            <p>{a.reviews.deleteConfirm(deleting.name)}</p>
            <p className="admin-modal-warn">{a.reviews.deleteWarning}</p>
            <div className="admin-modal-actions">
              <button className="btn-admin-secondary" onClick={() => setDeleting(null)}>{a.reviews.cancel}</button>
              <button className="btn-admin-primary" style={{ background: '#ef4444' }} onClick={handleDelete}>{a.reviews.deletePermanently}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/* ── Form modal ───────────────────────────────────────────────────── */
function ReviewFormModal({ review, onClose, onSaved, onToast }) {
  const isEdit = Boolean(review.id)
  const [form, setForm]         = useState({ ...EMPTY_REVIEW, ...review })
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr]           = useState('')
  const fileRef = useRef(null)

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleUpload(e) {
    const file = (e.target.files || [])[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await apiUploadImage(file)
      setForm(f => ({ ...f, image: url }))
    } catch (e2) {
      onToast(a.reviews.uploadFailed(e2.message), 'error')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSave() {
    if (!form.name.trim()) { setErr(a.reviews.errName); return }
    setSaving(true)
    const payload = {
      ...form,
      rating:     Number(form.rating) || 5,
      sort_order: Number(form.sort_order) || 0,
    }
    try {
      if (isEdit) await apiUpdateReview(review.id, payload)
      else        await apiCreateReview(payload)
      onToast(a.reviews.savedOk)
      onSaved()
    } catch (e2) {
      onToast(e2.message || a.reviews.saveFailed, 'error')
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3>{isEdit ? a.reviews.titleEdit : a.reviews.titleAdd}</h3>

        <div className="af-field">
          <label className="af-label">{a.reviews.fName} <span className="af-required">*</span></label>
          <input className={`af-input${err ? ' af-input--error' : ''}`} value={form.name} onChange={e => { set('name')(e); setErr('') }} placeholder={a.reviews.fNamePlaceholder} />
          {err && <span className="af-error-msg">{err}</span>}
        </div>

        <div className="af-field" style={{ marginTop: 14 }}>
          <label className="af-label">{a.reviews.fLocation}</label>
          <input className="af-input" value={form.location || ''} onChange={set('location')} placeholder={a.reviews.fLocationPlaceholder} />
        </div>

        <div className="af-field" style={{ marginTop: 14 }}>
          <label className="af-label">{a.reviews.fTitle}</label>
          <input className="af-input" value={form.title || ''} onChange={set('title')} placeholder={a.reviews.fTitlePlaceholder} />
        </div>

        <div className="af-field" style={{ marginTop: 14 }}>
          <label className="af-label">{a.reviews.fQuote}</label>
          <textarea className="af-input af-textarea" rows={4} value={form.quote || ''} onChange={set('quote')} placeholder={a.reviews.fQuotePlaceholder} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="af-field">
            <label className="af-label">{a.reviews.fRating}</label>
            <select className="af-input" value={form.rating} onChange={set('rating')}>
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
            </select>
          </div>
          <div className="af-field">
            <label className="af-label">{a.reviews.fBadge}</label>
            <input className="af-input" value={form.badge || ''} onChange={set('badge')} placeholder={a.reviews.fBadgePlaceholder} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="af-field">
            <label className="af-label">{a.reviews.fLang}</label>
            <select className="af-input" value={form.lang} onChange={set('lang')}>
              <option value="all">{a.reviews.langAll}</option>
              <option value="pt">{a.reviews.langPt}</option>
              <option value="en">{a.reviews.langEn}</option>
              <option value="uk">{a.reviews.langUk}</option>
            </select>
          </div>
          <div className="af-field">
            <label className="af-label">{a.reviews.fStatus}</label>
            <select className="af-input" value={form.status} onChange={set('status')}>
              <option value="visible">{a.reviews.statusVisible}</option>
              <option value="hidden">{a.reviews.statusHidden}</option>
            </select>
          </div>
          <div className="af-field">
            <label className="af-label">{a.reviews.fSortOrder}</label>
            <input type="number" className="af-input" value={form.sort_order} onChange={set('sort_order')} />
          </div>
        </div>

        {/* Image */}
        <div className="af-field" style={{ marginTop: 14 }}>
          <label className="af-label">{a.reviews.fImage}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {form.image
              ? <img src={form.image} alt="" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              : <div style={{ width: 72, height: 54, borderRadius: 8, background: '#eef2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>{(form.name || '?').charAt(0).toUpperCase()}</div>
            }
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button type="button" className="btn-admin-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? a.reviews.uploading : a.reviews.uploadImage}
              </button>
              {form.image
                ? <button type="button" className="admin-link" style={{ color: '#ef4444', textAlign: 'left' }} onClick={() => setForm(f => ({ ...f, image: '' }))}>{a.reviews.removeImage}</button>
                : <span className="af-hint">{a.reviews.noImage}</span>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleUpload} />
          </div>
        </div>

        <div className="admin-modal-actions">
          <button className="btn-admin-secondary" onClick={onClose} disabled={saving}>{a.reviews.cancel}</button>
          <button className="btn-admin-primary" onClick={handleSave} disabled={saving || uploading}>
            {saving ? a.reviews.saving : isEdit ? a.reviews.save : a.reviews.create}
          </button>
        </div>
      </div>
    </div>
  )
}
