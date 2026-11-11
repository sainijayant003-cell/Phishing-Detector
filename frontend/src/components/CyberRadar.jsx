import { useState, useEffect } from 'react'
import styles from './CyberRadar.module.css'

export default function CyberRadar({ phishingCount = 0 }) {
  const [blips, setBlips] = useState([
    { id: 1, top: '28%', left: '65%', color: '#ff4d6d', label: 'THREAT_01' },
    { id: 2, top: '70%', left: '35%', color: '#fbbf24', label: 'ANOMALY_02' },
    { id: 3, top: '45%', left: '80%', color: '#ff4d6d', label: 'PHISH_BOT' },
    { id: 4, top: '60%', left: '60%', color: '#34d399', label: 'NODE_CLEAN' },
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      // Randomly tweak one blip position slightly for live scanning feel
      setBlips(prev =>
        prev.map(b => ({
          ...b,
          top: `${Math.min(85, Math.max(15, parseFloat(b.top) + (Math.random() * 8 - 4)))}%`,
          left: `${Math.min(85, Math.max(15, parseFloat(b.left) + (Math.random() * 8 - 4)))}%`
        }))
      )
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.radarCard}>
      <div className={styles.radarHeader}>
        <div className={styles.titleGroup}>
          <span className={styles.radarIcon}>📡</span>
          <div>
            <strong>LIVE THREAT RADAR</strong>
            <small>AIR-GAPPED GEOSPACIAL INTERCEPTION</small>
          </div>
        </div>
        <span className={styles.statusPill}>SWEEPING 360°</span>
      </div>

      <div className={styles.screenWrapper}>
        <div className={styles.radarScreen}>
          {/* Concentric rings */}
          <div className={`${styles.ring} ${styles.ring1}`} />
          <div className={`${styles.ring} ${styles.ring2}`} />
          <div className={`${styles.ring} ${styles.ring3}`} />

          {/* Crosshairs */}
          <div className={styles.crosshairX} />
          <div className={styles.crosshairY} />

          {/* Rotating Beam */}
          <div className={styles.sweepBeam} />

          {/* Dynamic Blips */}
          {blips.map(b => (
            <div
              key={b.id}
              className={styles.blip}
              style={{ top: b.top, left: b.left }}
              title={b.label}
            >
              <span className={styles.blipDot} style={{ background: b.color }} />
              <span className={styles.blipWave} style={{ borderColor: b.color }} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.radarTelemetry}>
        <div className={styles.telItem}>
          <span>TARGETS IN SECTOR</span>
          <strong>{Math.max(4, phishingCount + 3)}</strong>
        </div>
        <div className={styles.telItem}>
          <span>INTERCEPTION RATIO</span>
          <strong style={{ color: 'var(--accent-cyan)' }}>99.8%</strong>
        </div>
        <div className={styles.telItem}>
          <span>FREQ BAND</span>
          <strong>GHz DEFENSE</strong>
        </div>
      </div>
    </div>
  )
}
