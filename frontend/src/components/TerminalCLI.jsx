import { useState, useRef, useEffect } from 'react'
import { scanUrl, scanEmail, getHistory } from '../services/api'
import { dissectUrl } from '../utils/urlDissector'
import { playKeyClick, playSafeChime, playThreatAlert } from '../utils/audio'
import styles from './TerminalCLI.module.css'

const BANNER = `PhishGuard Security CLI v2.4
Connected to engine on http://localhost:5000
Type 'help' to view available commands.`

export default function TerminalCLI({ isOpen, onClose, onToggleMatrix, onToggleSound }) {
  const [history, setHistory] = useState([
    { type: 'banner', text: BANNER },
  ])
  const [inputVal, setInputVal] = useState('')
  const [cmdIndex, setCmdIndex] = useState(-1)
  const [cmdHistory, setCmdHistory] = useState([])
  const [isExecuting, setIsExecuting] = useState(false)

  const terminalEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function executeCommand(cmdStr) {
    const trimmed = cmdStr.trim()
    if (!trimmed) return

    setCmdHistory(prev => [trimmed, ...prev])
    setCmdIndex(-1)
    playKeyClick()

    const parts = trimmed.split(' ')
    const command = parts[0].toLowerCase()
    const arg = parts.slice(1).join(' ')

    // Echo command
    setHistory(prev => [...prev, { type: 'input', text: `$ ${trimmed}` }])

    switch (command) {
      case 'help':
        setHistory(prev => [
          ...prev,
          {
            type: 'output',
            text: `Available commands:
  scan <url>          Run ML and threat intel scan on target URL
  scan-mail <text>    Analyze email text for phishing indicators
  dissect <url>       Inspect URL heuristics and Shannon entropy
  history             View recent scan records from database
  stats               Check backend health and loaded models
  matrix              Toggle matrix background
  sound               Toggle audio effects
  clear / cls         Clear terminal screen
  exit                Close console`
          }
        ])
        break

      case 'clear':
      case 'cls':
        setHistory([])
        break

      case 'matrix':
        if (onToggleMatrix) onToggleMatrix()
        setHistory(prev => [...prev, { type: 'system', text: 'Matrix background state changed.' }])
        break

      case 'sound':
        if (onToggleSound) onToggleSound()
        setHistory(prev => [...prev, { type: 'system', text: 'Audio effects state changed.' }])
        break

      case 'exit':
        onClose()
        break

      case 'stats':
        try {
          const res = await fetch('/api/health')
          const data = await res.json()
          setHistory(prev => [
            ...prev,
            {
              type: 'output',
              text: `Status: ${data.status}
Models:
  - Email classifier: ${data.models?.email_model_loaded ? 'Loaded' : 'Offline'}
  - URL classifier:   ${data.models?.url_model_loaded ? 'Loaded' : 'Offline'}`
            }
          ])
        } catch {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: 'Error connecting to backend health check.' }
          ])
        }
        break

      case 'scan':
        if (!arg) {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: 'Usage: scan <url>   (e.g. scan https://suspicious-site.tk)' }
          ])
          break
        }
        setIsExecuting(true)
        setHistory(prev => [
          ...prev,
          { type: 'system', text: `Analyzing target: ${arg}...` }
        ])
        try {
          const res = await scanUrl(arg)
          const isPhish = res.verdict === 'phishing'
          if (isPhish) playThreatAlert()
          else playSafeChime()

          setHistory(prev => [
            ...prev,
            {
              type: isPhish ? 'threat' : res.verdict === 'suspicious' ? 'warning' : 'safe',
              text: `Target:       ${res.scanned_url}
Verdict:      ${res.verdict} (confidence: ${res.confidence})
Risk score:   ${Math.round(res.risk_score * 100)}%
ML score:     ${(res.ml_score * 100).toFixed(1)}%
Threat intel: ${res.threat_intel_flagged ? 'Flagged threat' : 'Clean'}
Signals:
${res.signals.length ? res.signals.map(s => '  - ' + s).join('\n') : '  - None'}
Summary:      ${res.explanation}`
            }
          ])
        } catch (err) {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: `Scan failed: ${err.response?.data?.error || err.message}` }
          ])
        } finally {
          setIsExecuting(false)
        }
        break

      case 'scan-mail':
        if (!arg) {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: 'Usage: scan-mail <text>' }
          ])
          break
        }
        setIsExecuting(true)
        setHistory(prev => [
          ...prev,
          { type: 'system', text: 'Analyzing email text with NLP classifier...' }
        ])
        try {
          const res = await scanEmail(arg)
          const isPhish = res.verdict === 'phishing'
          if (isPhish) playThreatAlert()
          else playSafeChime()

          setHistory(prev => [
            ...prev,
            {
              type: isPhish ? 'threat' : 'safe',
              text: `Verdict:    ${res.verdict}
Risk score: ${Math.round(res.risk_score * 100)}%
ML score:   ${(res.ml_score * 100).toFixed(1)}%
Signals:
${res.signals.length ? res.signals.map(s => '  - ' + s).join('\n') : '  - None'}`
            }
          ])
        } catch (err) {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: `Scan failed: ${err.response?.data?.error || err.message}` }
          ])
        } finally {
          setIsExecuting(false)
        }
        break

      case 'dissect':
        if (!arg) {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: 'Usage: dissect <url>' }
          ])
          break
        }
        const dissection = dissectUrl(arg)
        if (!dissection.valid) {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: `Dissection error: ${dissection.error}` }
          ])
          break
        }
        setHistory(prev => [
          ...prev,
          {
            type: 'output',
            text: `URL dissection:
  - Host:           ${dissection.hostname}
  - Protocol:       ${dissection.protocol.toUpperCase()}
  - Numeric IP:     ${dissection.isIpHolder ? 'Yes' : 'No'}
  - Punycode:       ${dissection.isPunycode ? 'Detected' : 'Standard'}
  - Total entropy:  ${dissection.totalEntropy} bits
  - Heuristic risk: ${dissection.heuristicScore}%
  - Flags:          ${dissection.flags.length ? dissection.flags.join('; ') : 'None'}`
          }
        ])
        break

      case 'history':
        try {
          const res = await getHistory({ limit: 10 })
          const list = (res.scans || [])
            .map(s => `[#${s.id}] [${s.scan_type}] ${s.verdict} (${Math.round(s.risk_score * 100)}%) -> ${s.input_content.slice(0, 50)}`)
            .join('\n')
          setHistory(prev => [
            ...prev,
            { type: 'output', text: list || 'No scan records recorded.' }
          ])
        } catch {
          setHistory(prev => [
            ...prev,
            { type: 'error', text: 'Failed to retrieve scan records.' }
          ])
        }
        break

      default:
        setHistory(prev => [
          ...prev,
          { type: 'error', text: `Command not found: ${command}. Type 'help' for available commands.` }
        ])
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      executeCommand(inputVal)
      setInputVal('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0 && cmdIndex < cmdHistory.length - 1) {
        const nextIdx = cmdIndex + 1
        setCmdIndex(nextIdx)
        setInputVal(cmdHistory[nextIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (cmdIndex > 0) {
        const nextIdx = cmdIndex - 1
        setCmdIndex(nextIdx)
        setInputVal(cmdHistory[nextIdx])
      } else if (cmdIndex === 0) {
        setCmdIndex(-1)
        setInputVal('')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.terminalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.terminalHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.dotRed} onClick={onClose} title="Close" />
            <span className={styles.dotYellow} title="Minimize" />
            <span className={styles.dotGreen} title="Active" />
            <span className={styles.termTitle}>phishguard-terminal</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.sysTag}>Online</span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className={styles.terminalBody} onClick={() => inputRef.current?.focus()}>
          {history.map((item, idx) => (
            <div key={idx} className={`${styles.line} ${styles[item.type]}`}>
              <pre className={styles.pre}>{item.text}</pre>
            </div>
          ))}

          <div className={styles.promptLine}>
            <span className={styles.prompt}>$ </span>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isExecuting}
              autoFocus
              spellCheck="false"
            />
          </div>
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  )
}
