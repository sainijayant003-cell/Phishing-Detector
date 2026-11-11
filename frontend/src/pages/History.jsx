import { useState, useEffect, useMemo } from 'react'
import ScanHistory from '../components/ScanHistory'
import AlertBanner from '../components/AlertBanner'
import DossierModal from '../components/DossierModal'
import { getHistory, deleteScan } from '../services/api'
import styles from './History.module.css'

export default function History() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [selectedScan, setSelectedScan] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { type: filter } : {}
      const data = await getHistory(params)
      setScans(data.scans || [])
    } catch {
      setError('Could not load scan history. Ensure Flask is running on port 5000.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  async function handleDelete(id) {
    try {
      await deleteScan(id)
      setScans(prev => prev.filter(s => s.id !== id))
    } catch {
      setError('Failed to delete scan record.')
    }
  }

  const filteredScans = useMemo(() => {
    if (!searchQuery.trim()) return scans
    const q = searchQuery.toLowerCase()
    return scans.filter(s =>
      (s.input_content || '').toLowerCase().includes(q) ||
      (s.verdict || '').toLowerCase().includes(q) ||
      String(s.id).includes(q)
    )
  }, [scans, searchQuery])

  function handleExportCsv() {
    if (scans.length === 0) return
    const headers = 'ID,Type,Target,Verdict,Risk Score,Date\n'
    const rows = scans
      .map(s => `"${s.id}","${s.scan_type}","${(s.input_content || '').replace(/"/g, '""')}","${s.verdict}","${Math.round((s.risk_score || 0) * 100)}%","${s.created_at}"`)
      .join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phishguard_history_${Date.now()}.csv`
    a.click()
  }

  const total = scans.length
  const phishing = scans.filter(s => s.verdict === 'phishing').length
  const safe = scans.filter(s => s.verdict === 'safe').length
  const suspicious = scans.filter(s => s.verdict === 'suspicious').length
  const detectRate = total > 0 ? Math.round((phishing / total) * 100) : 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Scan archive</span>
          <h1 className={styles.title}>Scan history</h1>
          <p className={styles.subtitle}>All analyzed payloads stored in your local SQLite database.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.exportBtn} onClick={handleExportCsv} disabled={scans.length === 0}>
            Export CSV
          </button>
          <button className={styles.refreshBtn} onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        {[
          { label: 'Total scans',  value: total,           color: 'var(--text-primary)' },
          { label: 'Phishing',     value: phishing,        color: 'var(--accent-red)' },
          { label: 'Suspicious',   value: suspicious,      color: 'var(--accent-amber)' },
          { label: 'Safe',         value: safe,            color: 'var(--accent-green)' },
          { label: 'Threat rate',  value: `${detectRate}%`, color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      <div className={styles.controlBar}>
        <div className={styles.filterBar}>
          {[
            { id: 'all', label: 'All scans' },
            { id: 'url', label: 'URLs' },
            { id: 'email', label: 'Emails' }
          ].map(f => (
            <button
              key={f.id}
              className={filter === f.id ? `${styles.filterBtn} ${styles.filterBtnActive}` : styles.filterBtn}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <span className={styles.filterCount}>{filteredScans.length} records</span>
        </div>

        <div className={styles.searchWrap}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search targets or verdicts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <span className={styles.loadingDot} />
          Loading scan records...
        </div>
      ) : (
        <ScanHistory
          scans={filteredScans}
          onDelete={handleDelete}
          onSelectScan={scan => setSelectedScan({
            ...scan,
            signals: typeof scan.signals === 'string' ? JSON.parse(scan.signals || '[]') : scan.signals
          })}
        />
      )}

      {selectedScan && (
        <DossierModal
          result={selectedScan}
          onClose={() => setSelectedScan(null)}
        />
      )}
    </div>
  )
}
