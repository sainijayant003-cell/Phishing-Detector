import styles from './ScorePieMeter.module.css'

export default function ScorePieMeter({ score = 0, verdict = 'safe', size = 150, strokeWidth = 14 }) {
  const pct = Math.round(score * 100)

  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  const color =
    verdict === 'phishing' || pct >= 60
      ? 'var(--accent-red)'
      : verdict === 'suspicious' || pct >= 30
      ? 'var(--accent-amber)'
      : 'var(--accent-green)'

  const verdictLabel =
    verdict === 'phishing'
      ? 'Phishing threat'
      : verdict === 'suspicious'
      ? 'Suspicious'
      : 'Safe'

  return (
    <div className={styles.wrapper}>
      <div className={styles.chartBox} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
          {/* Background circle track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth={strokeWidth}
            className={styles.bgCircle}
          />

          {/* Active Score Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={styles.scoreArc}
          />

          {/* Inner hairline */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth - 4}
            fill="none"
            stroke="var(--border-dim)"
            strokeWidth="1"
          />
        </svg>

        <div className={styles.centerReadout}>
          <span className={styles.bigPct}>
            {pct}%
          </span>
          <span className={styles.scoreSub}>Risk index</span>
        </div>
      </div>

      <div className={styles.verdictTag} style={{ borderColor: `${color}40` }}>
        <span className={styles.dot} style={{ background: color }} />
        <span style={{ color }}>{verdictLabel}</span>
      </div>
    </div>
  )
}
