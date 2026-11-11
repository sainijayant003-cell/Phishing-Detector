import { useState } from 'react'
import styles from './CyberPieChart.module.css'

export default function CyberPieChart({
  data = [],
  size = 200,
  strokeWidth = 20,
  centerLabel = "Total scans",
  centerValue = null,
  showLegend = true
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
  const radius = (size - strokeWidth - 16) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let accumulatedOffset = 0
  const slices = data.map((item, idx) => {
    const value = Number(item.value) || 0
    const ratio = total > 0 ? value / total : 0
    const strokeDasharray = `${ratio * circumference} ${circumference}`
    const strokeDashoffset = -accumulatedOffset
    accumulatedOffset += ratio * circumference

    return {
      ...item,
      ratio,
      percentage: total > 0 ? Math.round(ratio * 100) : 0,
      strokeDasharray,
      strokeDashoffset,
      idx
    }
  })

  const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : null
  const displayValue = activeItem ? activeItem.value : (centerValue !== null ? centerValue : total)
  const displayLabel = activeItem ? activeItem.label : centerLabel

  return (
    <div className={styles.pieContainer}>
      <div className={styles.chartWrapper} style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={styles.svg}
        >
          {/* Quiet background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth={strokeWidth}
            className={styles.track}
          />

          {/* Donut Slices */}
          {total > 0 ? (
            slices.map(slice => {
              const isHovered = hoveredIdx === slice.idx
              return (
                <circle
                  key={slice.idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="butt"
                  className={styles.slice}
                  style={{
                    opacity: hoveredIdx !== null && !isHovered ? 0.4 : 1,
                    transition: 'opacity 140ms ease, stroke-width 140ms ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              )
            })
          ) : (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--border-dim)"
              strokeWidth={strokeWidth}
              strokeDasharray="4 4"
            />
          )}

          {/* Subtle inner hairline ring */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 - 6}
            fill="none"
            stroke="var(--border-dim)"
            strokeWidth="1"
          />
        </svg>

        {/* Center Readout */}
        <div className={styles.centerContent}>
          <span className={styles.centerValue}>
            {displayValue}
          </span>
          <span className={styles.centerLabel}>{displayLabel}</span>
          {activeItem && (
            <span className={styles.centerPct} style={{ color: activeItem.color }}>
              {activeItem.percentage}%
            </span>
          )}
        </div>
      </div>

      {showLegend && (
        <div className={styles.legend}>
          {slices.map(slice => {
            const isHovered = hoveredIdx === slice.idx
            return (
              <div
                key={slice.idx}
                className={`${styles.legendItem} ${isHovered ? styles.legendHovered : ''}`}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className={styles.legendLeft}>
                  <span
                    className={styles.colorDot}
                    style={{ background: slice.color }}
                  />
                  <span className={styles.labelText}>{slice.label}</span>
                </div>
                <div className={styles.legendRight}>
                  <span className={styles.valueText}>{slice.value}</span>
                  <span className={styles.pctText}>({slice.percentage}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
