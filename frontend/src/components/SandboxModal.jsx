import { useState } from 'react'
import styles from './SandboxModal.module.css'

export default function SandboxModal({ url, result, onClose }) {
  const [activeTab, setActiveTab] = useState('summary')

  if (!url) return null

  const isPhish = result?.verdict === 'phishing'

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <strong className={styles.modalTitle}>Quarantine sandbox preview</strong>
            <span className={styles.modalSub}>Read-only synthetic DOM and header extraction</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.navTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'summary' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            DOM analysis
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'viewport' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('viewport')}
          >
            Simulated viewport
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'headers' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('headers')}
          >
            Response headers
          </button>
        </div>

        <div className={styles.body}>
          {activeTab === 'summary' && (
            <div className={styles.summaryContent}>
              <div className={styles.warningBanner}>
                <span>Notice:</span> Interactive script execution is disabled. Content rendered in an isolated read-only container.
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Form action</span>
                  <strong style={{ color: isPhish ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                    {isPhish ? 'POST to external IP' : 'Same-origin HTTPS'}
                  </strong>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Password inputs</span>
                  <strong style={{ color: isPhish ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                    {isPhish ? 'Credential harvester detected' : '0 detected'}
                  </strong>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Hidden iframes</span>
                  <strong>{isPhish ? '1 hidden frame' : '0 detected'}</strong>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>External scripts</span>
                  <strong>{isPhish ? '5 unverified CDNs' : 'Clean origin'}</strong>
                </div>
              </div>

              <div className={styles.codeBox}>
                <div className={styles.codeHeader}>Extracted form elements</div>
                <pre className={styles.preCode}>
{`<form action="${isPhish ? 'http://185.220.101.4/collect.php' : '/api/v1/login'}" method="POST">
  <input type="text" name="username" placeholder="Username" />
  <input type="password" name="password" placeholder="Password" />
  <!-- ${isPhish ? 'Credential capture hook identified' : 'Standard CSRF protection'} -->
</form>`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'viewport' && (
            <div className={styles.viewportContainer}>
              <div className={styles.browserAddressBar}>
                <span className={styles.lockStatus}>{isPhish ? 'Unencrypted / Untrusted' : 'Encrypted'}</span>
                <span className={styles.urlDisplay}>{url}</span>
                <span className={styles.quarantinePill}>Quarantined</span>
              </div>

              <div className={styles.sandboxScreen}>
                <div className={styles.previewBox}>
                  <span className={styles.previewTitle}>
                    {isPhish ? 'Malicious page render blocked' : 'Benign simulation'}
                  </span>
                  <p>
                    Target entity intercepted and isolated to prevent token harvesting or unwanted script evaluation.
                  </p>
                  <code className={styles.targetUrl}>{url}</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className={styles.headersContent}>
              <div className={styles.codeHeader}>Simulated HTTP/2 transaction headers</div>
              <pre className={styles.preCode}>
{`GET / HTTP/2
Host: ${url.replace(/^https?:\/\//, '').split('/')[0]}
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) PhishGuard/2.4
Accept: text/html,application/xhtml+xml,application/xml;q=0.9

HTTP/2 200 OK
content-type: text/html; charset=UTF-8
server: ${isPhish ? 'nginx/1.18.0 (Ubuntu)' : 'Cloudflare'}
strict-transport-security: ${isPhish ? 'Missing (no HSTS)' : 'max-age=31536000'}
x-frame-options: ${isPhish ? 'Missing' : 'DENY'}
content-security-policy: ${isPhish ? 'Missing' : "default-src 'self'"}`}
              </pre>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerHint}>
            Isolated sandbox: Local storage, cookies, and network access disabled.
          </span>
          <button className={styles.closeBtnFooter} onClick={onClose}>
            Close sandbox
          </button>
        </div>
      </div>
    </div>
  )
}
