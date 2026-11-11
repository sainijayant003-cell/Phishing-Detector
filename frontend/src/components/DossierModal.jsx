import { useState } from 'react'
import styles from './DossierModal.module.css'

export default function DossierModal({ result, onClose }) {
  const [copied, setCopied] = useState(false)
  if (!result) return null

  const timestamp = new Date().toISOString()
  const scanTarget = result.scanned_url || result.input_content || 'Target payload'
  const isPhish = result.verdict === 'phishing'
  const isSuspicious = result.verdict === 'suspicious'

  const severityLevel = isPhish
    ? 'Critical threat (phishing)'
    : isSuspicious
    ? 'Suspicious anomaly'
    : 'Benign (safe)'

  const severityColor = isPhish ? 'var(--accent-red)' : isSuspicious ? 'var(--accent-amber)' : 'var(--accent-green)'

  const mitreMapping = isPhish
    ? [
        { id: 'T1566.002', name: 'Phishing: Spearphishing Link' },
        { id: 'T1204.001', name: 'User Execution: Malicious Link' },
        { id: 'T1059', name: 'Command and Scripting Interpreter' }
      ]
    : [
        { id: 'T1596', name: 'Search Open Technical Databases' },
        { id: 'T1598', name: 'Phishing for Information (Recon)' }
      ]

  const markdownReport = `
# PhishGuard Incident Dossier
**Incident reference:** PG-SOC-${result.scan_id || 9402}
**Timestamp:** ${timestamp}
**Target entity:** ${scanTarget}
**Vector:** ${(result.scan_type || 'url').toUpperCase()}

---
### 1. Executive Summary
- Classification: ${severityLevel}
- Risk score: ${Math.round(result.risk_score * 100)}%
- ML model confidence: ${(result.ml_score * 100).toFixed(1)}%
- Threat intelligence match: ${result.threat_intel_flagged ? 'Yes (SafeBrowsing / PhishTank)' : 'None'}

---
### 2. Triggered Heuristics
${(result.signals || []).map(s => `- ${s}`).join('\n') || '- No anomalous signals flagged.'}

---
### 3. MITRE ATT&CK Alignment
${mitreMapping.map(m => `- ${m.id}: ${m.name}`).join('\n')}

---
### 4. Containment Recommendations
1. ${isPhish ? 'Block target domain across firewall and DNS resolvers.' : 'Maintain regular access logging.'}
2. ${isPhish ? 'Invalidate active sessions for users who interacted with this link.' : 'Inspect email headers for DKIM/SPF alignment.'}
`

  function handleCopy() {
    navigator.clipboard.writeText(markdownReport.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerBadge}>
            <span className={styles.badgeDot} style={{ background: severityColor }} />
            <span>Forensic incident dossier</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.metaGrid}>
            <div>
              <span className={styles.metaLabel}>Incident ref</span>
              <strong className={styles.metaValue}>PG-SOC-{result.scan_id || '9402'}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Recorded</span>
              <strong className={styles.metaValue}>{new Date().toLocaleTimeString()}</strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Classification</span>
              <strong className={styles.metaValue} style={{ color: severityColor }}>
                {severityLevel}
              </strong>
            </div>
            <div>
              <span className={styles.metaLabel}>Risk index</span>
              <strong className={styles.metaValue} style={{ color: severityColor }}>
                {Math.round(result.risk_score * 100)}%
              </strong>
            </div>
          </div>

          <div className={styles.targetBox}>
            <span className={styles.metaLabel}>Analyzed target</span>
            <code className={styles.targetCode}>{scanTarget}</code>
          </div>

          <div className={styles.section}>
            <h3>Identified signals</h3>
            <ul className={styles.signalList}>
              {(result.signals || []).map((s, idx) => (
                <li key={idx} className={styles.signalItem}>
                  <span className={styles.signalDot} />
                  <span>{s}</span>
                </li>
              ))}
              {(!result.signals || result.signals.length === 0) && (
                <li className={styles.signalClean}>No anomalous heuristics triggered</li>
              )}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>MITRE ATT&CK alignment</h3>
            <div className={styles.mitreGrid}>
              {mitreMapping.map(m => (
                <div key={m.id} className={styles.mitreCard}>
                  <strong>{m.id}</strong>
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3>Remediation recommendation</h3>
            <p className={styles.remediationText}>
              {result.explanation || 'Payload inspected against standard heuristic rules and threat databases.'}
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy markdown'}
          </button>
          <button className={styles.printBtn} onClick={handlePrint}>
            Print / PDF
          </button>
        </div>
      </div>
    </div>
  )
}
