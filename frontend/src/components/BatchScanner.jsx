import { useState } from 'react'
import { scanUrl } from '../services/api'
import { playScanStart, playThreatAlert, playSafeChime } from '../utils/audio'
import styles from './BatchScanner.module.css'

const SAMPLE_BATCH = `http://paypa1-security-verification.tk/login
http://appleid.apple.com.ssl-verify.xyz/auth
https://github.com
http://chase-bank-online-alert.com/signin
https://google.com`

export default function BatchScanner({ onSelectResult }) {
  const [inputUrls, setInputUrls] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([])

  async function handleBatchScan() {
    const urls = inputUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 4)

    if (urls.length === 0) return

    setScanning(true)
    setProgress(0)
    setResults([])
    playScanStart()

    const scanList = []
    let threatFound = false

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      try {
        const res = await scanUrl(url)
        scanList.push({ url, success: true, ...res })
        if (res.verdict === 'phishing') threatFound = true
      } catch (err) {
        scanList.push({
          url,
          success: false,
          error: err.response?.data?.error || 'Scan timeout or network error'
        })
      }
      setProgress(Math.round(((i + 1) / urls.length) * 100))
      setResults([...scanList])
    }

    setScanning(false)
    if (threatFound) playThreatAlert()
    else playSafeChime()
  }

  function handleExportCsv() {
    if (results.length === 0) return
    const headers = 'URL,Verdict,Risk Score,ML Score,Signals\n'
    const rows = results
      .map(r => {
        if (!r.success) return `"${r.url}",Error,0,0,"${r.error}"`
        return `"${r.scanned_url || r.url}","${r.verdict}","${Math.round(r.risk_score * 100)}%","${Math.round(r.ml_score * 100)}%","${(r.signals || []).join('; ')}"`
      })
      .join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phishguard_batch_${Date.now()}.csv`
    a.click()
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topInfo}>
        <div>
          <h3 className={styles.title}>Batch URL triage</h3>
          <p className={styles.desc}>Analyze up to 25 URLs simultaneously against threat feeds and machine learning models.</p>
        </div>
        <button
          className={styles.sampleBtn}
          onClick={() => setInputUrls(SAMPLE_BATCH)}
          disabled={scanning}
        >
          Load test batch
        </button>
      </div>

      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          rows={6}
          value={inputUrls}
          onChange={e => setInputUrls(e.target.value)}
          placeholder="Enter one target URL per line...&#10;https://example-phish.tk/login&#10;https://legitimate-domain.com"
          disabled={scanning}
        />

        <div className={styles.actionRow}>
          <span className={styles.urlCount}>
            {inputUrls.split('\n').filter(u => u.trim()).length} targets loaded
          </span>
          <button
            className={styles.executeBtn}
            onClick={handleBatchScan}
            disabled={scanning || !inputUrls.trim()}
          >
            {scanning ? `Scanning (${progress}%)` : 'Run batch scan'}
          </button>
        </div>
      </div>

      {scanning && (
        <div className={styles.progressBarWrap}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <span>Batch results ({results.length} processed)</span>
            <button className={styles.exportBtn} onClick={handleExportCsv}>
              Export CSV
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Target URL</th>
                <th>Verdict</th>
                <th>Risk index</th>
                <th>Signals</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, idx) => (
                <tr key={idx} className={styles.row}>
                  <td className={styles.urlCell}><code>{item.url}</code></td>
                  <td>
                    {item.success ? (
                      <span className={`${styles.pill} ${styles[item.verdict]}`}>
                        {item.verdict === 'phishing' ? 'Phishing' : item.verdict === 'suspicious' ? 'Suspicious' : 'Safe'}
                      </span>
                    ) : (
                      <span className={`${styles.pill} ${styles.error}`}>Error</span>
                    )}
                  </td>
                  <td className={styles.scoreCell}>
                    {item.success ? `${Math.round(item.risk_score * 100)}%` : '—'}
                  </td>
                  <td className={styles.signalsCell}>
                    {item.success ? `${item.signals?.length || 0} flagged` : item.error}
                  </td>
                  <td>
                    {item.success && (
                      <button
                        className={styles.viewBtn}
                        onClick={() => onSelectResult && onSelectResult(item)}
                      >
                        Dossier
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
