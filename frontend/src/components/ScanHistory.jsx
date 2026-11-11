import styles from './ScanHistory.module.css'

const VERDICT_COLOR = {
  phishing:   'var(--accent-red)',
  suspicious: 'var(--accent-amber)',
  safe:       'var(--accent-green)',
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
}

function truncate(str, n = 55) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

export default function ScanHistory({ scans, onDelete, onSelectScan }) {
  if (!scans || scans.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No scan records found</p>
        <p className={styles.emptyHint}>Run an analysis to index records here</p>
      </div>
    )
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Target content</th>
            <th>Verdict</th>
            <th>Risk</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {scans.map(scan => {
            const verdictLabel =
              scan.verdict === 'phishing'
                ? 'Phishing'
                : scan.verdict === 'suspicious'
                ? 'Suspicious'
                : 'Safe'
            const color = VERDICT_COLOR[scan.verdict] || 'var(--text-secondary)'

            return (
              <tr key={scan.id} className={styles.row}>
                <td className={styles.idCell}>#{scan.id}</td>
                <td><span className={styles.typeChip}>{scan.scan_type || 'url'}</span></td>
                <td className={styles.contentCell}>{truncate(scan.input_content || '')}</td>
                <td>
                  <span
                    className={styles.verdictChip}
                    style={{
                      color,
                      borderColor: `${color}30`,
                      background: `${color}10`
                    }}
                  >
                    {verdictLabel}
                  </span>
                </td>
                <td>
                  <span className={styles.riskVal}>
                    {Math.round((scan.risk_score || 0) * 100)}%
                  </span>
                </td>
                <td className={styles.dateCell}>{formatDate(scan.created_at)}</td>
                <td className={styles.actionsCell}>
                  {onSelectScan && (
                    <button
                      className={styles.dossierBtn}
                      onClick={() => onSelectScan(scan)}
                      title="Inspect forensic dossier"
                    >
                      Dossier
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => onDelete(scan.id)}
                      title="Delete scan record"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
