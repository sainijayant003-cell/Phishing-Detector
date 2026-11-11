import { useState, useEffect } from 'react'
import styles from './ThreatIntelFeed.module.css'

const THREAT_EVENTS = [
  'Spearphishing campaign reported spoofing Microsoft 365 OAuth consent screens',
  'PhishTank feed: 3,842 newly registered malicious domain nodes cataloged in last 24h',
  'Typosquatting activity detected across financial service login portals',
  'Global telemetry: automated reverse proxy evasion identified in credential harvesters',
  'Direct deposit payroll spoofing lures reported across enterprise mail streams'
]

export default function ThreatIntelFeed() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % THREAT_EVENTS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.bar}>
      <div className={styles.labelGroup}>
        <span className={styles.statusDot} />
        <span className={styles.feedLabel}>Threat feed</span>
      </div>

      <div className={styles.feedText}>
        <span className={styles.eventItem}>
          {THREAT_EVENTS[currentIndex]}
        </span>
      </div>

      <span className={styles.feedStatus}>Feeds synchronized</span>
    </div>
  )
}
