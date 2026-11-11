import { useState, useEffect, useMemo } from 'react'
import ScanInput from '../components/ScanInput'
import ResultCard from '../components/ResultCard'
import AlertBanner from '../components/AlertBanner'
import ThreatIntelFeed from '../components/ThreatIntelFeed'
import BatchScanner from '../components/BatchScanner'
import DossierModal from '../components/DossierModal'
import CyberPieChart from '../components/CyberPieChart'
import { scanEmail, scanUrl, getHistory } from '../services/api'
import styles from './Dashboard.module.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getVerdictColor(verdict) {
  if (verdict === 'phishing') return 'var(--accent-red)'
  if (verdict === 'suspicious') return 'var(--accent-amber)'
  return 'var(--accent-green)'
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}

function ActivityChart({ scans }) {
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      return {
        key: date.toDateString(),
        label: DAYS[date.getDay()],
        date,
        total: 0,
        phishing: 0,
        safe: 0,
      }
    })

    scans.forEach(scan => {
      const date = new Date(scan.created_at)
      if (Number.isNaN(date.getTime())) return

      const day = days.find(item => item.key === date.toDateString())
      if (!day) return

      day.total += 1
      if (scan.verdict === 'phishing') day.phishing += 1
      if (scan.verdict === 'safe') day.safe += 1
    })

    return days
  }, [scans])

  const max = Math.max(1, ...chartData.map(day => day.total))

  return (
    <div className={styles.chart}>
      <div className={styles.chartLegend}>
        <span><i className={styles.legendTotal} /> Total scans</span>
        <span><i className={styles.legendThreat} /> Phishing</span>
      </div>

      <div className={styles.chartBars}>
        {chartData.map(day => (
          <div className={styles.chartColumn} key={day.key}>
            <div className={styles.barArea}>
              <span className={styles.barValue}>{day.total || ''}</span>
              <div
                className={styles.bar}
                title={`${day.total} scans (${day.phishing} threats)`}
                style={{ height: `${Math.max(day.total ? 10 : 3, (day.total / max) * 100)}%` }}
              >
                {day.phishing > 0 && (
                  <div
                    className={styles.phishingSegment}
                    style={{ height: `${(day.phishing / Math.max(1, day.total)) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <span className={styles.chartDay}>{day.label}</span>
          </div>
        ))}
      </div>

      <p className={styles.chartNote}>Daily scan volume over the last 7 days</p>
    </div>
  )
}

export default function Dashboard({ onOpenTerminal }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [scans, setScans] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [activeScanTab, setActiveScanTab] = useState('single')
  const [selectedScanForDossier, setSelectedScanForDossier] = useState(null)

  async function loadHistory() {
    try {
      const data = await getHistory()
      setScans(Array.isArray(data.scans) ? data.scans : [])
    } catch {
      setScans([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  async function handleScan(mode, value) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = mode === 'email'
        ? await scanEmail(value)
        : await scanUrl(value)

      setResult(data)
      await loadHistory()
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Could not reach backend services. Ensure Flask is running on port 5000.'
      )
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = scans.length
    const phishing = scans.filter(s => s.verdict === 'phishing').length
    const suspicious = scans.filter(s => s.verdict === 'suspicious').length
    const safe = scans.filter(s => s.verdict === 'safe').length

    return { total, phishing, suspicious, safe }
  }, [scans])

  const recentScans = scans.slice(0, 7)

  // Pie chart distribution data
  const threatPieData = useMemo(() => [
    { label: 'Phishing', value: stats.phishing, color: 'var(--accent-red)' },
    { label: 'Suspicious', value: stats.suspicious, color: 'var(--accent-amber)' },
    { label: 'Safe', value: stats.safe, color: 'var(--accent-green)' },
  ], [stats])

  const threatRatioPct = stats.total > 0
    ? Math.round((stats.phishing / stats.total) * 100)
    : 0

  return (
    <div className={styles.page}>
      {/* Live Threat Intelligence Marquee (quiet, restrained) */}
      <ThreatIntelFeed />

      <section className={styles.welcome}>
        <div>
          <span className={styles.eyebrow}>Security overview</span>
          <h1 className={styles.title}>PhishGuard security center</h1>
          <p className={styles.subtitle}>
            Analyze suspicious links and email content, review threat vectors, and inspect security telemetry.
          </p>
        </div>

        <div className={styles.topActions}>
          <button
            className={styles.cliTriggerBtn}
            onClick={onOpenTerminal}
            title="Open Netrunner Terminal (Ctrl + `)"
          >
            <span>Terminal console</span>
            <span className={styles.keycap}>⌘`</span>
          </button>
          <div className={styles.protectionBadge}>
            <span className={styles.radarDot} />
            <span>Detection active</span>
          </div>
        </div>
      </section>

      {error && (
        <AlertBanner
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Primary Stat Cards */}
      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <span>Total scans</span>
          </div>
          <strong className={styles.statNumber}>{historyLoading ? '—' : stats.total}</strong>
          <small className={styles.statMeta}>Indexed scan records</small>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <span>Phishing detected</span>
          </div>
          <strong className={styles.statNumber} style={{ color: 'var(--accent-red)' }}>
            {historyLoading ? '—' : stats.phishing}
          </strong>
          <small className={styles.statMeta}>{threatRatioPct}% of total volume</small>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <span>Suspicious</span>
          </div>
          <strong className={styles.statNumber} style={{ color: 'var(--accent-amber)' }}>
            {historyLoading ? '—' : stats.suspicious}
          </strong>
          <small className={styles.statMeta}>Require manual review</small>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <span>Safe entities</span>
          </div>
          <strong className={styles.statNumber} style={{ color: 'var(--accent-green)' }}>
            {historyLoading ? '—' : stats.safe}
          </strong>
          <small className={styles.statMeta}>Clean reputation checks</small>
        </article>
      </section>

      {/* Scanner Section with Mode Tabs */}
      <section className={styles.scannerSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Payload analysis</span>
            <h2 className={styles.sectionTitle}>Scan for threats</h2>
          </div>

          <div className={styles.scanModeSwitcher}>
            <button
              className={`${styles.modeSwitchBtn} ${activeScanTab === 'single' ? styles.modeSwitchActive : ''}`}
              onClick={() => setActiveScanTab('single')}
            >
              Single target
            </button>
            <button
              className={`${styles.modeSwitchBtn} ${activeScanTab === 'batch' ? styles.modeSwitchActive : ''}`}
              onClick={() => setActiveScanTab('batch')}
            >
              Batch scan
            </button>
          </div>
        </div>

        {activeScanTab === 'single' ? (
          <>
            <ScanInput onScan={handleScan} loading={loading} />

            {loading && (
              <div className={styles.analyzing}>
                <span className={styles.spinner} />
                <div className={styles.analyzingText}>
                  <strong>Evaluating content</strong>
                  <span>Extracting DNS records, SSL certificates, and NLP semantics...</span>
                </div>
              </div>
            )}

            <ResultCard result={result} />
          </>
        ) : (
          <BatchScanner onSelectResult={res => setSelectedScanForDossier(res)} />
        )}
      </section>

      {/* Cyber SOC Visualization Grid: PIE CHART + ACTIVITY + DEFENSE MATRIX */}
      <section className={styles.analyticsGrid}>
        {/* PIE CHART: Threat Outcome Distribution */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Threat distribution</h3>
              <p>Breakdown of all evaluated records</p>
            </div>
            <span className={styles.threatBadge}>
              {threatRatioPct}% threat rate
            </span>
          </div>

          <div className={styles.pieContainerWrap}>
            <CyberPieChart
              data={threatPieData}
              size={190}
              strokeWidth={20}
              centerLabel="Total scans"
              centerValue={historyLoading ? '—' : stats.total}
              showLegend={true}
            />
          </div>
        </article>

        {/* THREAT VELOCITY BAR CHART */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Scan velocity</h3>
              <p>Daily volume over the last 7 days</p>
            </div>
            <span className={styles.periodTag}>Last 7 days</span>
          </div>
          <ActivityChart scans={scans} />
        </article>

        {/* MITRE ATT&CK Defense Matrix Card */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Defense coverage</h3>
              <p>MITRE ATT&CK technique monitoring</p>
            </div>
            <span className={styles.matrixStatus}>Active</span>
          </div>

          <div className={styles.mitreGrid}>
            {[
              { id: 'T1566.001', name: 'Attachment lure', status: 'Protected', level: '99%' },
              { id: 'T1566.002', name: 'Spearphishing link', status: 'Active ML', level: '98%' },
              { id: 'T1566.003', name: 'Service spearphish', status: 'Heuristic', level: '96%' },
              { id: 'T1204.001', name: 'Malicious execution', status: 'Sandbox', level: '100%' },
              { id: 'T1078', name: 'Account spoofing', status: 'Detected', level: '97%' },
              { id: 'T1598', name: 'Information harvesting', status: 'NLP model', level: '99%' }
            ].map(m => (
              <div key={m.id} className={styles.mitreCard}>
                <div className={styles.mitreTop}>
                  <strong>{m.id}</strong>
                  <span className={styles.mitrePill}>{m.status}</span>
                </div>
                <span className={styles.mitreName}>{m.name}</span>
                <div className={styles.mitreBar}>
                  <div className={styles.mitreBarFill} style={{ width: m.level }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Recent Scans Table */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Recent scans</h3>
            <p>Latest payloads evaluated by the detection model</p>
          </div>
          <a href="/history" className={styles.viewAll}>View all records →</a>
        </div>

        {historyLoading ? (
          <p className={styles.emptyState}>Loading scan records...</p>
        ) : recentScans.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>No scans recorded</strong>
            <p>Enter a URL or email text above to run an analysis.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target content</th>
                  <th>Verdict</th>
                  <th>Risk</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map(scan => {
                  const color = getVerdictColor(scan.verdict)
                  const verdictLabel =
                    scan.verdict === 'phishing'
                      ? 'Phishing'
                      : scan.verdict === 'suspicious'
                      ? 'Suspicious'
                      : 'Safe'

                  return (
                    <tr key={scan.id}>
                      <td>
                        <span className={styles.typePill}>
                          {scan.scan_type || 'url'}
                        </span>
                      </td>
                      <td className={styles.inputCell}>
                        <code>{scan.input_content || '—'}</code>
                      </td>
                      <td>
                        <span
                          className={styles.verdict}
                          style={{
                            color,
                            borderColor: `${color}30`,
                            background: `${color}10`,
                          }}
                        >
                          {verdictLabel}
                        </span>
                      </td>
                      <td className={styles.riskCell}>
                        {Number.isFinite(Number(scan.risk_score))
                          ? `${Math.round(Number(scan.risk_score) * 100)}%`
                          : '—'}
                      </td>
                      <td className={styles.dateCell}>{formatDate(scan.created_at)}</td>
                      <td>
                        <button
                          className={styles.rowDossierBtn}
                          onClick={() => setSelectedScanForDossier({
                            ...scan,
                            signals: typeof scan.signals === 'string' ? JSON.parse(scan.signals || '[]') : scan.signals
                          })}
                        >
                          Dossier
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedScanForDossier && (
        <DossierModal
          result={selectedScanForDossier}
          onClose={() => setSelectedScanForDossier(null)}
        />
      )}
    </div>
  )
}
