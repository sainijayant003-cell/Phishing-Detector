import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Training from './pages/Training'
import MatrixRain from './components/MatrixRain'
import CRTOverlay from './components/CRTOverlay'
import TerminalCLI from './components/TerminalCLI'
import { isAudioEnabled, setAudioEnabled, playKeyClick } from './utils/audio'
import styles from './App.module.css'

const THEMES = [
  { value: 'unslop', label: 'Unslop Graphite', badge: 'Craft' },
  { value: 'unslop-ink', label: 'Unslop Ink', badge: 'Navy' },
  { value: 'unslop-light', label: 'Unslop Light', badge: 'Clean' },
  { value: 'cyberpunk-neon', label: 'Cyberpunk Neon', badge: 'Alt' },
  { value: 'cyber-blue', label: 'Cyber Blue', badge: 'Alt' },
  { value: 'hacker-green', label: 'Matrix Hacker', badge: 'Alt' },
]

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('phishguard-theme')
    return THEMES.some(theme => theme.value === saved) ? saved : 'unslop'
  } catch {
    return 'unslop'
  }
}

// Quiet, precision line icons (Unslop Pass 3: 16px, 1.5 stroke, text-role color)
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function TerminalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}

const navigation = [
  { label: 'Overview', icon: <ShieldIcon />, to: '/' },
  { label: 'Scan history', icon: <HistoryIcon />, to: '/history' },
  { label: 'Training lab', icon: <TargetIcon />, to: '/training' },
]

function Sidebar({ onOpenTerminal }) {
  return (
    <aside className={styles.sidebar}>
      <NavLink to="/" className={styles.brand}>
        <div className={styles.brandIconBox}>
          <ShieldIcon />
        </div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>PhishGuard</span>
          <span className={styles.brandMeta}>Threat analysis</span>
        </div>
      </NavLink>

      <div className={styles.sectionHeading}>Platform</div>

      <nav className={styles.sideNav}>
        {navigation.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.sideLink} ${isActive ? styles.sideLinkActive : ''}`
            }
          >
            <span className={styles.sideIcon}>{item.icon}</span>
            <span className={styles.sideLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.terminalShortcutBox}>
        <button
          className={styles.sidebarTermBtn}
          onClick={onOpenTerminal}
          title="Open Netrunner Terminal (Ctrl + `)"
        >
          <span className={styles.sideIcon}><TerminalIcon /></span>
          <span>Terminal console</span>
          <span className={styles.keycap}>⌘`</span>
        </button>
      </div>

      <div className={styles.sidebarBottom}>
        <div className={styles.statusRow}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>Detection models active</span>
        </div>
        <p className={styles.statusDesc}>
          Heuristics, XGBoost & threat feeds connected on port 5000
        </p>
      </div>
    </aside>
  )
}

function AppLayout({ theme, setTheme }) {
  const location = useLocation()
  // Default visual overlays to off for pure Unslop calm craft, user can toggle anytime
  const [matrixEnabled, setMatrixEnabled] = useState(false)
  const [crtEnabled, setCrtEnabled] = useState(false)
  const [soundActive, setSoundActive] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)

  // Listen for Ctrl+~ or Ctrl+` shortcut to open terminal
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '~')) {
        e.preventDefault()
        setTerminalOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function toggleSound() {
    const next = !soundActive
    setSoundActive(next)
    setAudioEnabled(next)
    if (next) playKeyClick()
  }

  const pageName =
    location.pathname === '/history'
      ? 'Scan history'
      : location.pathname === '/training'
      ? 'Training lab'
      : 'Overview'

  return (
    <div className={styles.app}>
      <MatrixRain enabled={matrixEnabled} />
      <CRTOverlay enabled={crtEnabled} />

      <Sidebar onOpenTerminal={() => setTerminalOpen(true)} />

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumbGroup}>
            <span className={styles.breadcrumbRoot}>PhishGuard</span>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{pageName}</span>
          </div>

          <div className={styles.topbarControls}>
            {/* Optional visual toggles (quiet, restrained) */}
            <button
              className={`${styles.toggleBtn} ${matrixEnabled ? styles.toggleBtnActive : ''}`}
              onClick={() => setMatrixEnabled(!matrixEnabled)}
              title="Toggle Matrix digital rain backdrop"
            >
              Matrix
            </button>

            <button
              className={`${styles.toggleBtn} ${crtEnabled ? styles.toggleBtnActive : ''}`}
              onClick={() => setCrtEnabled(!crtEnabled)}
              title="Toggle retro CRT scanlines"
            >
              CRT
            </button>

            <button
              className={`${styles.toggleBtn} ${soundActive ? styles.toggleBtnActive : ''}`}
              onClick={toggleSound}
              title="Toggle tactile sound effects"
            >
              {soundActive ? 'Audio on' : 'Muted'}
            </button>

            <button
              className={styles.terminalBtn}
              onClick={() => setTerminalOpen(true)}
              title="Open Terminal (Ctrl + `)"
            >
              <TerminalIcon />
              <span>CLI</span>
            </button>

            <div className={styles.themeSelectWrapper}>
              <select
                id="theme-select"
                className={styles.themeSelect}
                value={theme}
                onChange={event => setTheme(event.target.value)}
                aria-label="Theme selector"
              >
                {THEMES.map(item => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Dashboard onOpenTerminal={() => setTerminalOpen(true)} />} />
            <Route path="/history" element={<History />} />
            <Route path="/training" element={<Training />} />
          </Routes>
        </main>

        <footer className={styles.footer}>
          <span>PhishGuard threat intelligence & analysis engine</span>
          <span className={styles.footerMeta}>Design direction by Unslop</span>
        </footer>
      </div>

      <TerminalCLI
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        onToggleMatrix={() => setMatrixEnabled(prev => !prev)}
        onToggleSound={toggleSound}
      />
    </div>
  )
}

export default function App() {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme =
      theme === 'unslop-light' ? 'light' : 'dark'

    try {
      localStorage.setItem('phishguard-theme', theme)
    } catch {}
  }, [theme])

  function setTheme(nextTheme) {
    if (THEMES.some(item => item.value === nextTheme)) {
      setThemeState(nextTheme)
    }
  }

  return (
    <BrowserRouter>
      <AppLayout theme={theme} setTheme={setTheme} />
    </BrowserRouter>
  )
}
