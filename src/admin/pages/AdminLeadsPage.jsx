import { useState, useEffect } from 'react'
import { apiGetLeads } from '../adminApi'
import a from '../adminLang'

const SOURCE_LABELS = {
  form:   'Contacto',
  import: 'Importação',
  quiz:   'Questionário',
  popup:  'Oferta (popup)',
  widget: 'Widget',
  car:    'Viatura',
}
const SOURCE_COLORS = {
  form: 'green', import: 'amber', quiz: 'slate', popup: 'red', widget: 'slate', car: 'green',
}

function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d)) return s
  return d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function quizText(answers) {
  let v = answers
  if (typeof v === 'string') { try { v = JSON.parse(v) } catch { return v } }
  if (Array.isArray(v)) {
    return v.map((it, i) => (it && typeof it === 'object')
      ? `${it.question || it.q || `#${i + 1}`}: ${it.answer ?? it.a ?? it.value ?? ''}`
      : `${i + 1}. ${it}`).join(' · ')
  }
  if (v && typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k}: ${x}`).join(' · ')
  return v ? String(v) : ''
}

export default function AdminLeadsPage() {
  const [leads,   setLeads]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [source,  setSource]  = useState('all')

  useEffect(() => {
    apiGetLeads()
      .then(data => { setLeads(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const sources = ['all', ...Array.from(new Set(leads.map(l => l.source || 'form')))]
  const filtered = source === 'all' ? leads : leads.filter(l => (l.source || 'form') === source)

  return (
    <div className="admin-page">

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{a.leads.title}</h1>
          <p className="admin-page-sub">{a.leads.subtitle(leads.length)}</p>
        </div>
      </div>

      {error && <div className="admin-error-banner">{a.leads.failedToLoad} {error}</div>}

      {/* Source filter */}
      {!loading && leads.length > 0 && (
        <div className="admin-toolbar">
          <div className="admin-toolbar-filters">
            {sources.map(s => (
              <button
                key={s}
                className={`admin-filter-pill${source === s ? ' active' : ''}`}
                onClick={() => setSource(s)}
              >
                {s === 'all' ? a.leads.all : (SOURCE_LABELS[s] || s)}
                {s !== 'all' && (
                  <span className="admin-filter-pill-count">
                    {leads.filter(l => (l.source || 'form') === s).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="admin-section-card">
        {loading ? (
          <div className="admin-loading-sm"><div className="admin-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-sm">{a.leads.empty}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>{a.leads.colDate}</th>
                <th style={{ width: 110 }}>{a.leads.colSource}</th>
                <th>{a.leads.colName}</th>
                <th>{a.leads.colContact}</th>
                <th>{a.leads.colMessage}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const src = lead.source || 'form'
                const msg = [lead.message, quizText(lead.quiz_answers)].filter(Boolean).join(' · ')
                return (
                  <tr key={lead.id}>
                    <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: 13 }}>{fmtDate(lead.created_at)}</td>
                    <td>
                      <span className={`admin-status-badge admin-status--${SOURCE_COLORS[src] || 'slate'}`}>
                        {SOURCE_LABELS[src] || src}
                      </span>
                    </td>
                    <td>
                      <div className="admin-car-name">{lead.name || '—'}</div>
                      {lead.car_id && <div className="admin-car-meta">{a.leads.car} #{lead.car_id}</div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {lead.phone && <div><a className="admin-link" href={`tel:${lead.phone}`}>{lead.phone}</a></div>}
                      {lead.email && <div><a className="admin-link" href={`mailto:${lead.email}`}>{lead.email}</a></div>}
                      {!lead.phone && !lead.email && '—'}
                    </td>
                    <td style={{ maxWidth: 360, color: '#334155' }}>{msg || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
