import { useState, useEffect } from 'react'
import DossierModal from './DossierModal'
import SandboxModal from './SandboxModal'
import ScorePieMeter from './ScorePieMeter'
import CyberPieChart from './CyberPieChart'
import { playSafeChime, playThreatAlert, playSuspiciousWarning } from '../utils/audio'
import styles from './ResultCard.module.css'

const VERDICT_CONFIG = {
  phishing: {
    label: 'Phishing threat detected',
    color: 'var(--accent-red)',
    bg: 'var(--bg-surface)',
    border: 'rgba(229, 72, 77, 0.3)',
  },
  suspicious: {
    label: 'Suspicious content detected',
    color: 'var(--accent-amber)',
    bg: 'var(--bg-surface)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  safe: {
    label: 'Verified safe entity',
    color: 'var(--accent-green)',
    bg: 'var(--bg-surface)',
    border: 'rgba(76, 195, 138, 0.3)',
  },
}

export default function ResultCard({ result }) {
  const [showDossier, setShowDossier] = useState(false)
  const [showSandbox, setShowSandbox] = useState(false)
  const [showJson, setShowJson] = useState(false)

  useEffect(() => {
    if (!result) return
    if (result.verdict === 'phishing') {
      playThreatAlert()
    } else if (result.verdict === 'suspicious') {
      playSuspiciousWarning()
    } else if (result.verdict === 'safe') {
      playSafeChime()
    }
  }, [result])

  if (!result) return null

  const cfg = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.safe
  const mlPct = Math.round((result.ml_score || 0) * 100)
  const signals = result.signals || []
  const breakdown = result.score_breakdown || {}

  const breakdownPieData = [
    {
      label: 'ML Model',
      value: Math.round((breakdown.ml_contribution || 0) * 100) || 50,
      color: 'var(--accent-primary)'
    },
    {
      label: 'Threat Intel',
      value: Math.round((breakdown.threat_intel_contribution || 0) * 100) || 35,
      color: 'var(--accent-red)'
    },
    {
      label: 'Heuristics',
      value: Math.round((breakdown.rules_contribution || 0) * 100) || 15,
      color: 'var(--accent-amber)'
    }
  ]

  return (
    <>
      <div
        className={styles.card}
        style={{ borderColor: cfg.border }}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.statusDot} style={{ background: cfg.color }} />
            <div>
              <span className={styles.verdictTitle} style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              <span className={styles.targetSub}>
                Target: <code>{result.scanned_url || result.input_content?.slice(0, 75) || 'Analyzed input'}</code>
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.scanIdTag}>Scan #{result.scan_id || 'local'}</span>
          </div>
        </div>

        {/* Primary Telemetry Area: Circular Pie Score Display */}
        <div className={styles.pieScoreSection}>
          <div className={styles.mainScorePie}>
            <ScorePieMeter
              score={result.risk_score || 0}
              verdict={result.verdict}
              size={150}
              strokeWidth={14}
            />
          </div>

          <div className={styles.pieDetailsCol}>
            <div className={styles.hudCard}>
              <span className={styles.hudLabel}>Model confidence</span>
              <div className={styles.hudValRow}>
                <span className={styles.hudVal}>
                  {mlPct}%
                </span>
                <span className={styles.hudFoot}>
                  {result.scan_type === 'email' ? 'TF-IDF NLP' : 'XGBoost ensemble'}
                </span>
              </div>
            </div>

            <div className={styles.hudCard}>
              <span className={styles.hudLabel}>Threat reputation</span>
              <div className={styles.hudValRow}>
                <span
                  className={styles.hudVal}
                  style={{ color: result.threat_intel_flagged ? 'var(--accent-red)' : 'var(--text-primary)' }}
                >
                  {result.threat_intel_flagged ? 'Flagged threat' : 'Clean'}
                </span>
                <span className={styles.hudFoot}>Google SafeBrowsing & PhishTank</span>
              </div>
            </div>

            <div className={styles.hudCard}>
              <span className={styles.hudLabel}>Triggered heuristics</span>
              <div className={styles.hudValRow}>
                <span className={styles.hudVal}>
                  {signals.length} {signals.length === 1 ? 'signal' : 'signals'}
                </span>
                <span className={styles.hudFoot}>Structural heuristics</span>
              </div>
            </div>
          </div>

          {/* Mini Pie Chart for Breakdown */}
          {breakdown && (
            <div className={styles.breakdownPieBox}>
              <span className={styles.breakdownTitle}>Weight distribution</span>
              <CyberPieChart
                data={breakdownPieData}
                size={120}
                strokeWidth={14}
                centerLabel="Weights"
                centerValue="100%"
                showLegend={false}
              />
              <div className={styles.miniLegend}>
                {breakdownPieData.map(d => (
                  <span key={d.label} style={{ color: d.color }}>
                    ● {d.label} ({d.value}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Explanation & Signals */}
        <div className={styles.explanationBox}>
          <p className={styles.explanationText}>
            <strong>Analysis brief:</strong> {result.explanation || 'Payload inspected across structural heuristic and threat intelligence sources.'}
          </p>
        </div>

        {signals.length > 0 && (
          <div className={styles.signalsSection}>
            <span className={styles.signalsHeader}>
              Identified heuristic signals ({signals.length})
            </span>
            <div className={styles.signalsGrid}>
              {signals.map((sig, idx) => (
                <div key={idx} className={styles.signalBadge}>
                  <span className={styles.signalDot} />
                  <span>{sig}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className={styles.actionsBar}>
          <div className={styles.actionLeft}>
            <button
              className={styles.dossierBtn}
              onClick={() => setShowDossier(true)}
            >
              Generate forensic dossier
            </button>

            {result.scanned_url && (
              <button
                className={styles.sandboxBtn}
                onClick={() => setShowSandbox(true)}
              >
                Quarantine sandbox
              </button>
            )}
          </div>

          <div className={styles.actionRight}>
            <button
              className={styles.jsonToggleBtn}
              onClick={() => setShowJson(!showJson)}
            >
              {showJson ? 'Hide JSON' : 'Inspect JSON'}
            </button>
          </div>
        </div>

        {showJson && (
          <div className={styles.rawJsonBox}>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>

      {showDossier && (
        <DossierModal
          result={result}
          onClose={() => setShowDossier(false)}
        />
      )}

      {showSandbox && (
        <SandboxModal
          url={result.scanned_url || result.input_content}
          result={result}
          onClose={() => setShowSandbox(false)}
        />
      )}
    </>
  )
}
