import { useState, useMemo } from 'react'
import { dissectUrl } from '../utils/urlDissector'
import { playKeyClick } from '../utils/audio'
import styles from './ScanInput.module.css'

const DEMO_PAYLOADS = {
  url: [
    { label: 'PayPal alert', value: 'http://paypal-security-update.account-verification.tk/login' },
    { label: 'Apple sign-in', value: 'http://appleid.apple.com.ssl-verify.xyz/auth' },
    { label: 'Numeric IP host', value: 'http://192.168.1.105:8080/secure/login' },
    { label: 'Clean domain (GitHub)', value: 'https://github.com/security' },
  ],
  email: [
    {
      label: 'Account suspension',
      value: 'URGENT: Your banking access has been suspended due to 3 suspicious failed login attempts. Verify your identity within 24 hours at http://verify-secure-bank.tk or your account will be permanently deactivated.'
    },
    {
      label: 'CEO wire request',
      value: 'Are you at your desk? I am currently in an executive meeting and cannot take calls. I need you to initiate an urgent vendor wire transfer of $42,500 before the end of the day. Send confirmation receipt once done.'
    },
    {
      label: 'Team meeting agenda',
      value: 'Hi team, please find attached the agenda for tomorrow morning\'s product design review at 10:00 AM. Let me know if anyone has items they would like to add.'
    }
  ]
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export default function ScanInput({ onScan, loading }) {
  const [mode, setMode] = useState('url')
  const [value, setValue] = useState('')

  const dissection = useMemo(() => {
    if (mode === 'url' && value.trim().length > 3) {
      return dissectUrl(value)
    }
    return null
  }, [mode, value])

  function handleInputChange(e) {
    setValue(e.target.value)
    playKeyClick()
  }

  function handleLoadDemo(demoValue) {
    setValue(demoValue)
    playKeyClick()
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim() || loading) return
    onScan(mode, value.trim())
  }

  return (
    <div className={styles.container}>
      <form className={styles.wrapper} onSubmit={handleSubmit}>
        <div className={styles.modeBar}>
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'url' ? styles.modeBtnActive : ''}`}
              onClick={() => { setMode('url'); setValue('') }}
            >
              <LinkIcon />
              <span>URL scan</span>
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'email' ? styles.modeBtnActive : ''}`}
              onClick={() => { setMode('email'); setValue('') }}
            >
              <MailIcon />
              <span>Email content</span>
            </button>
          </div>

          <span className={styles.modeHint}>
            {mode === 'url' ? 'XGBoost and threat intel checks' : 'TF-IDF NLP text classifier'}
          </span>
        </div>

        <div className={styles.quickSamples}>
          <span className={styles.quickLabel}>Samples:</span>
          {DEMO_PAYLOADS[mode].map((demo, idx) => (
            <button
              key={idx}
              type="button"
              className={styles.demoPill}
              onClick={() => handleLoadDemo(demo.value)}
              disabled={loading}
            >
              {demo.label}
            </button>
          ))}
        </div>

        <div className={styles.inputWrap}>
          {mode === 'email' ? (
            <textarea
              className={styles.textarea}
              value={value}
              onChange={handleInputChange}
              placeholder="Paste suspicious email text, headers, or body content here..."
              rows={6}
              disabled={loading}
            />
          ) : (
            <input
              className={styles.urlinput}
              type="text"
              value={value}
              onChange={handleInputChange}
              placeholder="Enter URL to analyze (e.g. https://verify-login-portal.tk)..."
              disabled={loading}
            />
          )}

          <div className={styles.inputFooter}>
            <span className={styles.charCount}>
              {value.length > 0 ? `${value.length} characters` : 'Ready for input'}
            </span>

            <button
              type="submit"
              className={styles.scanBtn}
              disabled={!value.trim() || loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Analyze target</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Real-time Live URL Dissector Preview */}
      {dissection && dissection.valid && (
        <div className={styles.dissectorBox}>
          <div className={styles.dissectorHeader}>
            <span className={styles.dissectorTitle}>Heuristic pre-scan telemetry</span>
            <span className={styles.entropyBadge}>
              Shannon entropy: <strong className={styles.entropyVal}>{dissection.totalEntropy} bits</strong>
            </span>
          </div>

          <div className={styles.dissectorGrid}>
            <div className={styles.telemetryCard}>
              <span className={styles.telLabel}>Protocol</span>
              <strong style={{ color: dissection.protocol === 'http' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {dissection.protocol.toUpperCase()}
              </strong>
            </div>

            <div className={styles.telemetryCard}>
              <span className={styles.telLabel}>Host format</span>
              <strong style={{ color: dissection.isIpHolder ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                {dissection.isIpHolder ? 'Raw IP' : 'Domain'}
              </strong>
            </div>

            <div className={styles.telemetryCard}>
              <span className={styles.telLabel}>Punycode / IDN</span>
              <strong style={{ color: dissection.isPunycode ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                {dissection.isPunycode ? 'Detected' : 'Standard'}
              </strong>
            </div>

            <div className={styles.telemetryCard}>
              <span className={styles.telLabel}>Heuristic risk</span>
              <strong style={{ color: dissection.heuristicScore > 40 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                {dissection.heuristicScore}%
              </strong>
            </div>
          </div>

          {dissection.flags.length > 0 && (
            <div className={styles.flagsRow}>
              <span className={styles.flagsLabel}>Flags:</span>
              <div className={styles.flagsList}>
                {dissection.flags.map((flag, idx) => (
                  <span key={idx} className={styles.flagChip}>
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
